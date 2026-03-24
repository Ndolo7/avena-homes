"""
Root conftest.py

Django's test runner normally creates a fresh `test_<DBNAME>` database.
In CI (GitHub Actions), the test user has CREATEDB and this works normally.

On local dev (where the DB user lacks CREATEDB), we fall back to creating
an isolated `avena_homes_test` schema inside the existing database instead.

The `DJANGO_TEST_USE_SCHEMA` env var forces schema-isolation mode explicitly.
"""
import os
import pytest


def _has_createdb() -> bool:
    """Check whether the current DB user has CREATEDB privilege."""
    from django.db import connection
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user;")
            row = cur.fetchone()
            return bool(row and row[0])
    except Exception:
        return False


@pytest.fixture(scope="session")
def django_db_setup(django_test_environment, django_db_blocker):
    """
    Session-scoped DB fixture.

    - If the user has CREATEDB (CI): use the standard Django test database.
    - Otherwise (local dev): create an isolated schema instead.
    """
    force_schema = os.environ.get("DJANGO_TEST_USE_SCHEMA", "").lower() == "true"

    with django_db_blocker.unblock():
        use_schema = force_schema or not _has_createdb()

    if not use_schema:
        # Standard path — let Django create/destroy test_<DB> normally.
        from django.test.utils import setup_databases
        setup_databases(verbosity=0, interactive=False)
        yield
        return

    # Schema-isolation path (local dev without CREATEDB).
    test_schema = "avena_homes_test"

    with django_db_blocker.unblock():
        from django.db import connection
        from django.core.management import call_command

        with connection.cursor() as cursor:
            cursor.execute(f"DROP SCHEMA IF EXISTS {test_schema} CASCADE;")
            cursor.execute(f"CREATE SCHEMA {test_schema};")

        connection.settings_dict["OPTIONS"] = {
            "options": f"-c search_path={test_schema}"
        }
        connection.close()

        call_command("migrate", "--run-syncdb", verbosity=0)

    yield

    with django_db_blocker.unblock():
        from django.db import connection
        connection.close()
        connection.settings_dict["OPTIONS"] = {"options": "-c search_path=avena_homes"}
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute(f"DROP SCHEMA IF EXISTS {test_schema} CASCADE;")
