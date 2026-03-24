from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import Unit
from .models import Tenant, Tenancy
from .serializers import OnboardTenantSerializer, TenantSerializer, TenancySerializer


class IsLandlordOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("landlord", "admin")


class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    permission_classes = [IsLandlordOrAdmin]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Tenant.objects.select_related("user").all()
        from django.db.models import Q
        return Tenant.objects.filter(
            Q(landlord=self.request.user) |
            Q(tenancies__unit__property__landlord=self.request.user)
        ).select_related("user").distinct()

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)

    @action(detail=True, methods=["get"])
    def tenancies(self, request, pk=None):
        tenant = self.get_object()
        qs = tenant.tenancies.select_related("unit__property").all()
        return Response(TenancySerializer(qs, many=True).data)


class OnboardTenantView(APIView):
    """POST /api/tenants/onboard/ — atomically creates a user + tenant profile."""

    permission_classes = [IsLandlordOrAdmin]

    def post(self, request):
        serializer = OnboardTenantSerializer(
            data=request.data,
            context={"request": request, "landlord": request.user},
        )
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()
        return Response(TenantSerializer(tenant).data, status=status.HTTP_201_CREATED)


class TenancyViewSet(viewsets.ModelViewSet):
    serializer_class = TenancySerializer
    permission_classes = [IsLandlordOrAdmin]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Tenancy.objects.select_related(
                "tenant__user", "unit__property__landlord"
            ).all()
        return Tenancy.objects.filter(
            unit__property__landlord=self.request.user
        ).select_related("tenant__user", "unit__property")

    def perform_create(self, serializer):
        tenancy = serializer.save()
        # Mark unit as occupied
        tenancy.unit.status = Unit.STATUS_OCCUPIED
        tenancy.unit.save(update_fields=["status", "updated_at"])

    def perform_update(self, serializer):
        old_unit = self.get_object().unit
        tenancy = serializer.save()
        
        # If the unit was changed during a transfer, free the old unit and occupy the new
        if old_unit.id != tenancy.unit_id:
            old_unit.status = Unit.STATUS_VACANT
            old_unit.save(update_fields=["status", "updated_at"])
            if tenancy.is_active:
                tenancy.unit.status = Unit.STATUS_OCCUPIED
                tenancy.unit.save(update_fields=["status", "updated_at"])

        # Sync unit status when tenancy is deactivated entirely
        if not tenancy.is_active:
            tenancy.unit.status = Unit.STATUS_VACANT
            tenancy.unit.save(update_fields=["status", "updated_at"])
