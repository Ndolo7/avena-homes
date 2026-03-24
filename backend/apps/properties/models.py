"""
Property and Unit models.

A Landlord owns many Properties. Each Property has many Units.
Units track availability state (vacant / occupied / maintenance).
"""
from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base that stamps created_at / updated_at on every subclass."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Property(TimeStampedModel):
    """
    A physical real-estate asset owned by a Landlord.
    One landlord can own many properties.
    """
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
        limit_choices_to={"role": "landlord"},
    )
    name = models.CharField(max_length=255)
    address = models.TextField()
    county = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="properties/covers/", blank=True, null=True)

    class Meta:
        verbose_name_plural = "Properties"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.landlord.get_full_name()})"

    @property
    def total_units(self) -> int:
        return self.units.count()

    @property
    def occupied_units(self) -> int:
        return self.units.filter(status=Unit.STATUS_OCCUPIED).count()


class Unit(TimeStampedModel):
    """
    A single rentable space within a Property (apartment, shop, office, etc.).
    Its `status` field is the source of truth for availability.
    """
    STATUS_VACANT = "vacant"
    STATUS_OCCUPIED = "occupied"
    STATUS_MAINTENANCE = "maintenance"
    STATUS_CHOICES = [
        (STATUS_VACANT, "Vacant"),
        (STATUS_OCCUPIED, "Occupied"),
        (STATUS_MAINTENANCE, "Under Maintenance"),
    ]

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="units",
    )
    unit_number = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_VACANT)
    bedrooms = models.PositiveSmallIntegerField(default=1)
    bathrooms = models.PositiveSmallIntegerField(default=1)
    size_sqft = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    floor_number = models.PositiveSmallIntegerField(null=True, blank=True)
    # Base rent is a reference; actual rent charged lives on the Tenancy record.
    base_rent = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = [["property", "unit_number"]]
        ordering = ["property", "unit_number"]

    def __str__(self) -> str:
        return f"Unit {self.unit_number} — {self.property.name}"
