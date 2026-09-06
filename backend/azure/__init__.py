"""
Azure Ecosystem Services for PRISM / Sentrix Autonomous SRE Platform.
Provides adapters for:
1. Azure Database for PostgreSQL Flexible Server (with SSL and connection pool optimization)
2. Azure Cache for Redis (TLS 6380 with seamless In-Memory fallback)
3. Azure Blob Storage (with seamless Local Filesystem mirror)
4. Azure Key Vault (with seamless Local Environment & DB vault)
5. Automated Disaster Recovery & Database Backup
"""
from backend.azure.blob_storage import AzureBlobStorageService, blob_storage_service
from backend.azure.redis_cache import AzureRedisCacheService, cache_service
from backend.azure.key_vault import AzureKeyVaultService, key_vault_service
from backend.azure.postgres_adapter import get_postgres_urls, get_postgres_health_metadata
from backend.azure.backup_service import AzureBackupService, backup_service
from backend.azure.config_manager import AzureConfigManager, config_manager
from backend.azure.project_storage import ProjectStorageService, project_storage

__all__ = [
    "AzureBlobStorageService",
    "blob_storage_service",
    "AzureRedisCacheService",
    "cache_service",
    "AzureKeyVaultService",
    "key_vault_service",
    "get_postgres_urls",
    "get_postgres_health_metadata",
    "AzureBackupService",
    "backup_service",
    "AzureConfigManager",
    "config_manager",
    "ProjectStorageService",
    "project_storage",
]


