from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Property, Unit
from .serializers import PropertyListSerializer, PropertySerializer, UnitSerializer


class IsLandlordOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("landlord", "admin")

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        owner = obj.landlord if isinstance(obj, Property) else obj.property.landlord
        return owner == request.user


class PropertyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsLandlordOrAdmin]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Property.objects.prefetch_related("units").all()
        return Property.objects.prefetch_related("units").filter(landlord=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        return PropertySerializer

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)


class UnitViewSet(viewsets.ModelViewSet):
    serializer_class = UnitSerializer
    permission_classes = [IsLandlordOrAdmin]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Unit.objects.select_related("property").all()
        return Unit.objects.select_related("property").filter(
            property__landlord=self.request.user
        )

    def perform_create(self, serializer):
        prop = serializer.validated_data["property"]
        if prop.landlord != self.request.user and self.request.user.role != "admin":
            raise PermissionDenied("You can only add units to your own properties.")
        serializer.save()

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        count = int(request.data.get("count", 1))
        prefix = request.data.get("prefix", "")
        start_number = int(request.data.get("start_number", 1))
        
        # Extract common unit data
        unit_data = request.data.copy()
        unit_data.pop("count", None)
        unit_data.pop("prefix", None)
        unit_data.pop("start_number", None)
        
        created_units = []
        errors = []
        
        with transaction.atomic():
            for i in range(count):
                current_number = start_number + i
                unit_number = f"{prefix}{current_number}"
                
                iter_data = unit_data.copy()
                iter_data["unit_number"] = unit_number
                
                serializer = self.get_serializer(data=iter_data)
                if serializer.is_valid():
                    prop = serializer.validated_data["property"]
                    if prop.landlord != request.user and request.user.role != "admin":
                        raise PermissionDenied("You can only add units to your own properties.")
                    unit = serializer.save()
                    created_units.append(self.get_serializer(unit).data)
                else:
                    errors.append({"unit_number": unit_number, "errors": serializer.errors})
            
            if errors:
                transaction.set_rollback(True)
                return Response(
                    {"detail": "Bulk creation failed", "errors": errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        return Response(
            {"created": len(created_units), "units": created_units},
            status=status.HTTP_201_CREATED
        )
