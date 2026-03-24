from django.contrib import admin

from .models import Property, Unit


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0
    fields = ["unit_number", "status", "bedrooms", "base_rent", "floor_number"]
    show_change_link = True


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ["name", "landlord", "county", "total_units", "occupied_units", "created_at"]
    list_filter = ["county"]
    search_fields = ["name", "address", "landlord__email"]
    inlines = [UnitInline]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ["unit_number", "property", "status", "bedrooms", "base_rent", "created_at"]
    list_filter = ["status", "property"]
    search_fields = ["unit_number", "property__name"]
    readonly_fields = ["created_at", "updated_at"]
