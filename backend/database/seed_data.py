"""Explicit, idempotent platform reference data. Never creates demo tenants or activity."""
import argparse
from sqlalchemy import select
from backend.database.connection import get_sync_db
from backend.database.models import RoleDefinition, User
from backend.auth.rbac import SYSTEM_ROLES
from backend.auth.identity import SEEDED_ADMIN_EMAIL, SEEDED_ADMIN_NAME, seeded_admin_user_id


def seed_database():
    with get_sync_db() as db:
        admin_id = seeded_admin_user_id()
        admin = db.scalar(select(User).where(User.id == admin_id))
        if not admin:
            admin = User(
                id=admin_id,
                email=SEEDED_ADMIN_EMAIL,
                full_name=SEEDED_ADMIN_NAME,
                role="PLATFORM_ADMIN",
                department="Platform Engineering",
                is_active=True,
            )
            admin.row_hash = admin.calculate_row_hash({"id": admin_id, "email": SEEDED_ADMIN_EMAIL})
            db.add(admin)
        else:
            admin.role = "PLATFORM_ADMIN"
            admin.is_active = True

        for key, definition in SYSTEM_ROLES.items():
            if db.scalar(select(RoleDefinition).where(RoleDefinition.role_key == key)):
                continue
            row = RoleDefinition(
                id=f"role_{key.lower()}", role_key=key,
                display_name=definition["display_name"],
                description=definition["description"], scope=definition["scope"],
                capabilities=definition["capabilities"], is_system_role=True, is_custom=False,
            )
            row.row_hash = row.calculate_row_hash({"role_key": key})
            db.add(row)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write system role reference data to the configured database")
    args = parser.parse_args()
    if not args.apply:
        parser.error("Refusing to write implicitly. Re-run with --apply after creating the schema.")
    seed_database()
