"""Canonical identity configuration for the local Sentrix deployment."""

import os


SEEDED_ADMIN_USER_ID = os.getenv("SENTRIX_SEEDED_ADMIN_USER_ID", "usr_admin_01")
SEEDED_ADMIN_EMAIL = os.getenv("SENTRIX_SEEDED_ADMIN_EMAIL", "admin@sentrix.local")
SEEDED_ADMIN_NAME = os.getenv("SENTRIX_SEEDED_ADMIN_NAME", "Sentrix Platform Admin")


def seeded_admin_user_id() -> str:
    """Return the configured bootstrap admin identity used by this deployment."""
    return SEEDED_ADMIN_USER_ID
