from rest_framework import serializers

from .models import Property, Unit


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = [
            "id", "property", "unit_number", "status", "bedrooms", "bathrooms",
            "size_sqft", "floor_number", "base_rent", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PropertySerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True)
    total_units = serializers.IntegerField(read_only=True)
    occupied_units = serializers.IntegerField(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "landlord", "name", "address", "county", "description",
            "cover_image", "total_units", "occupied_units", "units",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "landlord", "created_at", "updated_at"]


class PropertyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested units)."""
    total_units = serializers.IntegerField(read_only=True)
    occupied_units = serializers.IntegerField(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "name", "county", "total_units", "occupied_units", "created_at",
        ]
