from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update an admin/superuser account."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="admin")
        parser.add_argument("--password", default="Test1234")
        parser.add_argument("--first-name", default="Admin")
        parser.add_argument("--last-name", default="User")

    def handle(self, *args, **options):
        user_model = get_user_model()
        username_field = user_model.USERNAME_FIELD

        username = options["username"]
        password = options["password"]
        first_name = options["first_name"]
        last_name = options["last_name"]

        lookup = {username_field: username}
        user = user_model.objects.filter(**lookup).first()

        if user is None:
            create_kwargs = {
                username_field: username,
                "password": password,
            }
            if hasattr(user_model, "first_name"):
                create_kwargs["first_name"] = first_name
            if hasattr(user_model, "last_name"):
                create_kwargs["last_name"] = last_name
            if hasattr(user_model, "role"):
                create_kwargs["role"] = "admin"

            user_model.objects.create_superuser(**create_kwargs)
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {username}"))
            return

        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if hasattr(user, "first_name"):
            user.first_name = first_name
        if hasattr(user, "last_name"):
            user.last_name = last_name
        if hasattr(user, "role"):
            user.role = "admin"
        user.save(update_fields=[
            "password",
            "is_staff",
            "is_superuser",
            "is_active",
            *(["first_name"] if hasattr(user, "first_name") else []),
            *(["last_name"] if hasattr(user, "last_name") else []),
            *(["role"] if hasattr(user, "role") else []),
        ])

        self.stdout.write(self.style.SUCCESS(f"Updated admin user: {username}"))
