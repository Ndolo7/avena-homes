from django.contrib import admin

from .models import Tenant, Tenancy


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ["__str__", "phone_number", "national_id", "kra_pin", "created_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "national_id"]
    readonly_fields = ["created_at", "updated_at"]


class TenancyInline(admin.TabularInline):
    model = Tenancy
    extra = 0
    fields = ["unit", "rent_amount", "move_in_date", "move_out_date", "is_active", "credit_balance"]
    show_change_link = True


@admin.register(Tenancy)
class TenancyAdmin(admin.ModelAdmin):
    list_display = [
        "__str__", "rent_amount", "billing_cycle", "move_in_date",
        "move_out_date", "is_active", "credit_balance",
    ]
    list_filter = ["is_active", "billing_cycle"]
    search_fields = [
        "tenant__user__email", "tenant__user__first_name",
        "unit__unit_number", "unit__property__name",
    ]
    readonly_fields = ["created_at", "updated_at"]
