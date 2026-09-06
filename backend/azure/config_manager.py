"""
Azure Ecosystem Configuration & Dynamic Connection Testing Manager.
Allows testing connections to Azure PostgreSQL, Azure Redis, Azure Blob Storage,
and Azure Key Vault, or reconfiguring environment references dynamically at runtime.
Also provides deep visibility into local folder reflection (./storage/blobs/ and ./storage/backups/).
"""
import asyncio
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy import text

from backend.azure.blob_storage import blob_storage_service, LOCAL_BLOB_ROOT
from backend.azure.redis_cache import cache_service
from backend.azure.key_vault import key_vault_service
from backend.azure.postgres_adapter import get_postgres_urls, get_postgres_health_metadata
from backend.azure.backup_service import backup_service, LOCAL_BACKUP_DIR

logger = logging.getLogger("prism.azure.config_manager")


class AzureConfigManager:
    """
    Orchestrates configuration switches, connectivity tests, and storage reflection.
    """

    @staticmethod
    async def get_storage_reflection_overview() -> Dict[str, Any]:
        """
        Returns full local folder reflection statistics for blobs and backups.
        """
        blob_files = await blob_storage_service.list_local_files()
        blob_stats = await blob_storage_service.get_local_folder_stats()
        backups = await backup_service.list_backups()

        total_backup_bytes = sum(b.get("size_bytes", 0) for b in backups)

        return {
            "status": "OPERATIONAL",
            "storage_root": str(Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage")))),
            "blob_mirror": {
                "local_path": str(LOCAL_BLOB_ROOT),
                "total_files": blob_stats["total_files"],
                "total_bytes": blob_stats["total_bytes"],
                "containers": blob_stats["container_counts"],
                "recent_files": blob_files[:20]
            },
            "backups_folder": {
                "local_path": str(LOCAL_BACKUP_DIR),
                "total_backups": len(backups),
                "total_bytes": total_backup_bytes,
                "backups": backups[:10]
            }
        }

    @staticmethod
    async def test_all_connections(test_config: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Performs non-destructive latency and authentication tests across all 4 Azure subsystems.
        """
        results: Dict[str, Any] = {}
        t_start = time.time()

        # 1. PostgreSQL Test
        pg_start = time.time()
        try:
            from backend.database.connection import get_async_db
            async with get_async_db() as db:
                res = await db.execute(text("SELECT version();"))
                version = res.scalar()
                pg_meta = get_postgres_health_metadata()
                pg_latency = int((time.time() - pg_start) * 1000)
                results["postgresql"] = {
                    "status": "SUCCESS",
                    "latency_ms": pg_latency,
                    "target": "Azure Database for PostgreSQL Flexible Server" if pg_meta["is_azure_flexible_server"] else "Local PostgreSQL",
                    "ssl_enforced": pg_meta["ssl_enforced"],
                    "version": version.split()[0] if version else "PostgreSQL"
                }
        except Exception as e:
            results["postgresql"] = {
                "status": "FAILED",
                "error": str(e),
                "latency_ms": int((time.time() - pg_start) * 1000)
            }

        # 2. Redis Cache Test
        redis_start = time.time()
        try:
            cache_health = await cache_service.get_health()
            test_key = f"sentrix_health_probe_{int(time.time())}"
            await cache_service.set(test_key, "probe_ok", expire_seconds=10)
            val = await cache_service.get(test_key)
            await cache_service.delete(test_key)
            redis_latency = int((time.time() - redis_start) * 1000)
            results["redis"] = {
                "status": "SUCCESS" if val == "probe_ok" else "DEGRADED",
                "provider": cache_health.get("provider"),
                "latency_ms": redis_latency,
                "details": cache_health
            }
        except Exception as e:
            results["redis"] = {
                "status": "FAILED",
                "error": str(e),
                "latency_ms": int((time.time() - redis_start) * 1000)
            }

        # 3. Blob Storage Test
        blob_start = time.time()
        try:
            blob_health = await blob_storage_service.get_health()
            test_blob_name = f"diagnostics/probe_{int(time.time())}.txt"
            upload_res = await blob_storage_service.upload_blob(
                container="evidence-bundles",
                blob_name=test_blob_name,
                data="Azure blob storage probe successful.",
                content_type="text/plain"
            )
            downloaded = await blob_storage_service.download_blob(
                container="evidence-bundles",
                blob_name=test_blob_name
            )
            await blob_storage_service.delete_blob("evidence-bundles", test_blob_name)
            blob_latency = int((time.time() - blob_start) * 1000)
            results["blob_storage"] = {
                "status": "SUCCESS" if downloaded == b"Azure blob storage probe successful." else "DEGRADED",
                "provider": upload_res.get("provider"),
                "latency_ms": blob_latency,
                "local_mirror_path": str(LOCAL_BLOB_ROOT),
                "upload_metadata": upload_res
            }
        except Exception as e:
            results["blob_storage"] = {
                "status": "FAILED",
                "error": str(e),
                "latency_ms": int((time.time() - blob_start) * 1000)
            }

        # 4. Key Vault Test
        vault_start = time.time()
        try:
            vault_health = await key_vault_service.get_health()
            # Try fetching a known key or probing
            test_val = await key_vault_service.get_secret("GEMINI_API_KEY")
            vault_latency = int((time.time() - vault_start) * 1000)
            results["key_vault"] = {
                "status": "SUCCESS",
                "provider": vault_health.get("provider"),
                "latency_ms": vault_latency,
                "secret_lookup": "Configured" if test_val else "Not Set",
                "details": vault_health
            }
        except Exception as e:
            results["key_vault"] = {
                "status": "FAILED",
                "error": str(e),
                "latency_ms": int((time.time() - vault_start) * 1000)
            }

        overall_ok = all(v.get("status") in ("SUCCESS", "OPERATIONAL") for v in results.values())
        return {
            "overall_status": "HEALTHY" if overall_ok else "WARNING",
            "total_diagnostic_time_ms": int((time.time() - t_start) * 1000),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "subsystems": results
        }

    @staticmethod
    async def apply_references(references: Dict[str, str]) -> Dict[str, Any]:
        """
        Dynamically applies changed references and tests connections.
        """
        for k, v in references.items():
            if v is not None:
                os.environ[k] = str(v)

        # Reconfigure Blob Storage if keys supplied
        if any(k in references for k in ["AZURE_STORAGE_CONNECTION_STRING", "AZURE_STORAGE_ACCOUNT_NAME", "AZURE_STORAGE_ACCOUNT_KEY"]):
            blob_storage_service.reconfigure(
                connection_string=references.get("AZURE_STORAGE_CONNECTION_STRING"),
                account_name=references.get("AZURE_STORAGE_ACCOUNT_NAME"),
                account_key=references.get("AZURE_STORAGE_ACCOUNT_KEY")
            )

        # Reconfigure Redis if keys supplied
        if any(k in references for k in ["AZURE_REDIS_HOST", "AZURE_REDIS_PASSWORD", "AZURE_REDIS_PORT", "AZURE_REDIS_SSL", "AZURE_REDIS_CONNECTION_STRING"]):
            await cache_service.reconfigure(
                redis_host=references.get("AZURE_REDIS_HOST"),
                redis_port=int(references["AZURE_REDIS_PORT"]) if "AZURE_REDIS_PORT" in references else None,
                redis_password=references.get("AZURE_REDIS_PASSWORD"),
                redis_ssl=references.get("AZURE_REDIS_SSL", "").lower() == "true" if "AZURE_REDIS_SSL" in references else None,
                redis_url=references.get("AZURE_REDIS_CONNECTION_STRING")
            )

        # Run fresh connectivity test
        test_results = await AzureConfigManager.test_all_connections()
        return {
            "status": "REFERENCES_APPLIED",
            "applied_keys": list(references.keys()),
            "connectivity_test": test_results
        }


config_manager = AzureConfigManager()
