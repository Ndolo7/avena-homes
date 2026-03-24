from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.accounts.serializers import UserSerializer
from .models import Tenant, Tenancy


class TenantSerializer(serializers.ModelSerializer):
    """
    Read/Write serializer for Tenant profiles.

    On reads:  `user` is the nested UserSerializer representation.
    On writes: `user_id` (integer FK) is accepted to link an existing CustomUser.
               This allows a landlord/admin to onboard a tenant by:
               1. Creating a CustomUser (via /api/accounts/register/)
               2. POSTing to /api/tenants/tenants/ with that user's id.
    """
    # Read: nested user representation
    user = UserSerializer(read_only=True)

    # Write: accept the user PK
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=CustomUser.ROLE_TENANT),
        source="user",
        write_only=True,
    )
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id", "user", "user_id", "full_name", "phone_number",
            "national_id", "kra_pin", "date_of_birth",
            "emergency_contact_name", "emergency_contact_phone",
            "notes", "created_at",
        ]
        read_only_fields = ["id", "user", "full_name", "created_at"]

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def validate_user_id(self, user):
        if Tenant.objects.filter(user=user).exists():
            raise serializers.ValidationError(
                "A tenant profile already exists for this user."
            )
        return user

    def update(self, instance, validated_data):
        # Allow nested updates of user data if provided
        request = self.context.get("request")
        if request and hasattr(request, "data"):
            user_data = request.data.get("user", {})
            if isinstance(user_data, dict) and user_data:
                user = instance.user
                if "first_name" in user_data:
                    user.first_name = user_data["first_name"]
                if "last_name" in user_data:
                    user.last_name = user_data["last_name"]
                if "email" in user_data:
                    user.email = user_data["email"]
                user.save()

        # Update Tenant fields
        return super().update(instance, validated_data)


class OnboardTenantSerializer(serializers.Serializer):
    """
    Single-step, atomic serializer for landlord/admin to onboard a new tenant.

    Accepts all user fields + tenant KYC fields in one payload and creates
    both records inside a database transaction.  This prevents orphaned user
    accounts when tenant-profile validation fails.
    """

    # ── User fields ─────────────────────────────────────────────────────────
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        default="Avena@12345!",
        required=False,
    )

    # ── Tenant / KYC fields ──────────────────────────────────────────────────
    phone_number = serializers.CharField(max_length=30)
    national_id = serializers.CharField(max_length=20)
    kra_pin = serializers.CharField(max_length=20, default="", required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    emergency_contact_name = serializers.CharField(
        max_length=255, default="", required=False, allow_blank=True
    )
    emergency_contact_phone = serializers.CharField(
        max_length=30, default="", required=False, allow_blank=True
    )
    notes = serializers.CharField(default="", required=False, allow_blank=True)

    # ── Up-front uniqueness checks with clear messages ────────────────────────
    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value

    def validate_national_id(self, value):
        if Tenant.objects.filter(national_id=value).exists():
            raise serializers.ValidationError(
                "A tenant with this national ID already exists."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        landlord = self.context["landlord"]
        password = validated_data.pop("password", "Avena@12345!")

        user = CustomUser.objects.create_user(
            email=validated_data.pop("email"),
            password=password,
            first_name=validated_data.pop("first_name"),
            last_name=validated_data.pop("last_name"),
            role=CustomUser.ROLE_TENANT,
        )

        tenant = Tenant.objects.create(user=user, landlord=landlord, **validated_data)
        return tenant


class TenancySerializer(serializers.ModelSerializer):
    tenant_name = serializers.SerializerMethodField()
    unit_display = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()

    class Meta:
        model = Tenancy
        fields = [
            "id", "tenant", "tenant_name", "unit", "unit_display", "property_name",
            "rent_amount", "deposit_amount", "billing_cycle", "billing_day",
            "move_in_date", "move_out_date", "is_active", "credit_balance",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "credit_balance", "created_at", "updated_at"]

    def get_tenant_name(self, obj):
        return obj.tenant.user.get_full_name()

    def get_unit_display(self, obj):
        if obj.unit.floor_number:
            return f"Floor {obj.unit.floor_number}, Unit {obj.unit.unit_number}"
        return f"Unit {obj.unit.unit_number}"

    def get_property_name(self, obj):
        return obj.unit.property.name

    def validate(self, attrs):
        unit = attrs.get("unit")
        instance = self.instance

        if attrs.get("is_active", True):
            qs = Tenancy.objects.filter(unit=unit, is_active=True)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"unit": "This unit already has an active tenancy."}
                )
        return attrs
