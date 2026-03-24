"""
Factory Boy factories for all models.
Use these in tests — never raw model.objects.create() calls.
"""
import factory
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.payments.models import Invoice, Ledger, OrphanedTransaction, PaystackSubaccount, Transaction
from apps.properties.models import Property, Unit
from apps.tenants.models import Tenant, Tenancy


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser

    email = factory.Sequence(lambda n: f"user{n}@avena.test")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = CustomUser.ROLE_LANDLORD
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "testpass123!")
        manager = cls._get_manager(model_class)
        return manager.create_user(*args, password=password, **kwargs)


class LandlordFactory(UserFactory):
    role = CustomUser.ROLE_LANDLORD


class TenantUserFactory(UserFactory):
    role = CustomUser.ROLE_TENANT


class AdminFactory(UserFactory):
    role = CustomUser.ROLE_ADMIN
    is_staff = True


class PropertyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Property

    landlord = factory.SubFactory(LandlordFactory)
    name = factory.Sequence(lambda n: f"Avena Apartments Block {n}")
    address = factory.Faker("address")
    county = "Nairobi"
    description = factory.Faker("paragraph")


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Unit

    property = factory.SubFactory(PropertyFactory)
    unit_number = factory.Sequence(lambda n: f"A{n:03d}")
    status = Unit.STATUS_VACANT
    bedrooms = 2
    bathrooms = 1
    base_rent = factory.Faker("pydecimal", left_digits=5, right_digits=2, positive=True)


class TenantProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tenant

    user = factory.SubFactory(TenantUserFactory)
    phone_number = factory.Sequence(lambda n: f"+2547{n:08d}")
    national_id = factory.Sequence(lambda n: f"3{n:07d}")
    kra_pin = factory.Sequence(lambda n: f"A{n:09d}Z")


class TenancyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tenancy

    tenant = factory.SubFactory(TenantProfileFactory)
    unit = factory.SubFactory(UnitFactory)
    rent_amount = 25000
    deposit_amount = 25000
    billing_cycle = Tenancy.BILLING_MONTHLY
    billing_day = 1
    move_in_date = factory.Faker("date_this_decade")
    is_active = True


class PaystackSubaccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PaystackSubaccount

    landlord = factory.SubFactory(LandlordFactory)
    subaccount_code = factory.Sequence(lambda n: f"ACCT_{n:06d}")
    business_name = factory.Faker("company")
    bank_code = "057"
    account_number = factory.Sequence(lambda n: f"00{n:08d}")
    percentage_charge = 2.5


class InvoiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Invoice

    tenancy = factory.SubFactory(TenancyFactory)
    invoice_number = factory.Sequence(lambda n: f"INV-202401-{n:06d}")
    amount_due = 25000
    amount_paid = 0
    status = Invoice.STATUS_PENDING
    due_date = factory.Faker("future_date")
    period_start = factory.Faker("date_this_month")
    period_end = factory.Faker("future_date")


class TransactionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Transaction

    tenancy = factory.SubFactory(TenancyFactory)
    paystack_reference = factory.Sequence(lambda n: f"ref_{n:010d}")
    amount = 25000
    currency = "KES"
    channel = Transaction.CHANNEL_MOBILE_MONEY
    status = Transaction.STATUS_SUCCESS
    payer_email = factory.Faker("email")


class OrphanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrphanedTransaction

    paystack_reference = factory.Sequence(lambda n: f"orphan_ref_{n:010d}")
    amount = 10000
    currency = "KES"
    payer_email = factory.Faker("email")
    channel = Transaction.CHANNEL_MOBILE_MONEY
    status = OrphanedTransaction.STATUS_PENDING
    failure_reason = "Missing tenancy_id in metadata."
    raw_payload = {}
