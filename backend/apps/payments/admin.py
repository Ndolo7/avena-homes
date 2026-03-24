from django.contrib import admin
from django.utils.html import format_html

from .models import Invoice, Ledger, OrphanedTransaction, PaystackSubaccount, Transaction


@admin.register(PaystackSubaccount)
class PaystackSubaccountAdmin(admin.ModelAdmin):
    list_display = ["business_name", "landlord", "subaccount_code", "bank_name", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["landlord__email", "business_name", "subaccount_code"]
    readonly_fields = ["subaccount_code", "paystack_response", "created_at", "updated_at"]


class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    fields = ["paystack_reference", "amount", "channel", "status", "created_at"]
    readonly_fields = fields
    can_delete = False
    show_change_link = True


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number", "tenancy", "amount_due", "amount_paid",
        "balance_due_display", "status", "due_date",
    ]
    list_filter = ["status"]
    search_fields = ["invoice_number", "tenancy__tenant__user__email"]
    readonly_fields = ["invoice_number", "amount_paid", "created_at", "updated_at"]
    inlines = [TransactionInline]

    @admin.display(description="Balance Due")
    def balance_due_display(self, obj):
        val = obj.balance_due
        color = "red" if val > 0 else "green"
        return format_html('<span style="color:{}">{}</span>', color, val)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "paystack_reference", "amount", "currency", "channel",
        "status", "payer_email", "created_at",
    ]
    list_filter = ["status", "channel"]
    search_fields = ["paystack_reference", "payer_email"]
    readonly_fields = [f.name for f in Transaction._meta.get_fields() if hasattr(f, "name")]


@admin.register(Ledger)
class LedgerAdmin(admin.ModelAdmin):
    list_display = ["tenancy", "entry_type", "amount", "description", "balance_after", "created_at"]
    list_filter = ["entry_type"]
    readonly_fields = [f.name for f in Ledger._meta.get_fields() if hasattr(f, "name")]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(OrphanedTransaction)
class OrphanedTransactionAdmin(admin.ModelAdmin):
    list_display = [
        "paystack_reference", "amount", "currency", "payer_email",
        "status", "failure_reason", "created_at",
    ]
    list_filter = ["status", "channel"]
    search_fields = ["paystack_reference", "payer_email"]
    readonly_fields = [
        "paystack_reference", "amount", "currency", "payer_email",
        "channel", "failure_reason", "raw_payload", "created_at",
    ]
    actions = ["mark_dismissed"]

    @admin.action(description="Dismiss selected orphaned transactions")
    def mark_dismissed(self, request, queryset):
        updated = queryset.filter(status="pending").update(
            status=OrphanedTransaction.STATUS_DISMISSED,
            resolved_by=request.user,
        )
        self.message_user(request, f"{updated} transaction(s) dismissed.")
