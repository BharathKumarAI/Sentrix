"""
Azure Database for PostgreSQL Flexible Server Connection Adapter.
Automatically optimizes connection parameters, SSL enforcement, and connection pooling
when connecting to Azure PostgreSQL or local PostgreSQL.
"""
import logging
import os
import urllib.parse
from typing import Any, Dict

logger = logging.getLogger("prism.azure.postgres")


def get_postgres_urls() -> Dict[str, str]:
    """
    Returns properly formatted sync and async PostgreSQL connection URLs.
    Detects Azure Database for PostgreSQL Flexible Server and enforces SSL.
    """
    sync_url = os.getenv("DATABASE_URL_SYNC", "postgresql+psycopg://localhost:5432/prism_db")
    async_url = os.getenv("DATABASE_URL_ASYNC", "postgresql+asyncpg://localhost:5432/prism_db")

    # If Azure-specific variables are supplied, build dynamic URL
    azure_host = os.getenv("AZURE_POSTGRESQL_HOST")
    azure_user = os.getenv("AZURE_POSTGRESQL_USER")
    azure_pass = os.getenv("AZURE_POSTGRESQL_PASSWORD", "")
    azure_db = os.getenv("AZURE_POSTGRESQL_DATABASE", "prism_db")
    azure_port = os.getenv("AZURE_POSTGRESQL_PORT", "5432")

    if azure_host:
        encoded_pass = urllib.parse.quote_plus(azure_pass)
        user_part = f"{azure_user}:{encoded_pass}@" if azure_user else ""
        sync_url = f"postgresql+psycopg://{user_part}{azure_host}:{azure_port}/{azure_db}?sslmode=require"
        async_url = f"postgresql+asyncpg://{user_part}{azure_host}:{azure_port}/{azure_db}?ssl=require"
        logger.info(f"[PostgreSQL] Configured for Azure Database for PostgreSQL Flexible Server: {azure_host}")
    else:
        # Check if DATABASE_URL already has an azure domain
        if "postgres.database.azure.com" in sync_url and "sslmode" not in sync_url:
            separator = "&" if "?" in sync_url else "?"
            sync_url = f"{sync_url}{separator}sslmode=require"
        if "postgres.database.azure.com" in async_url and "ssl" not in async_url:
            separator = "&" if "?" in async_url else "?"
            async_url = f"{async_url}{separator}ssl=require"

    return {
        "sync_url": sync_url,
        "async_url": async_url,
        "is_azure": bool(azure_host or "postgres.database.azure.com" in sync_url)
    }


def get_postgres_health_metadata() -> Dict[str, Any]:
    """Returns metadata about the PostgreSQL deployment target."""
    urls = get_postgres_urls()
    return {
        "is_azure_flexible_server": urls["is_azure"],
        "ssl_enforced": urls["is_azure"] or "ssl" in urls["sync_url"],
        "driver_async": "asyncpg",
        "driver_sync": "psycopg"
    }
