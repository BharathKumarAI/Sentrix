"""
Azure Key Vault Secrets Service with Seamless Local / Database Fallback.
When AZURE_KEY_VAULT_NAME is set, resolves credentials from Azure Key Vault.
When running locally, seamlessly resolves from environment variables and the PostgreSQL
iam.api_keys vault table.
"""
import asyncio
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger("prism.azure.key_vault")


class AzureKeyVaultService:
    """
    Unified Secret Management Adapter for Azure Key Vault & Local PostgreSQL Vault.
    """

    def __init__(self):
        self.vault_name = os.getenv("AZURE_KEY_VAULT_NAME")
        self.vault_url = os.getenv("AZURE_KEY_VAULT_URL") or (
            f"https://{self.vault_name}.vault.azure.net" if self.vault_name else None
        )
        self.use_azure = bool(self.vault_url)
        self._client = None

        if self.use_azure:
            try:
                from azure.identity import DefaultAzureCredential
                from azure.keyvault.secrets import SecretClient
                credential = DefaultAzureCredential()
                self._client = SecretClient(vault_url=self.vault_url, credential=credential)
                logger.info(f"[KeyVault] Connected to Azure Key Vault: {self.vault_url}")
            except Exception as e:
                logger.warning(f"[KeyVault] Could not initialize Azure Key Vault client ({e}). Using Local Environment & DB Vault.")
                self.use_azure = False
        else:
            logger.info("[KeyVault] Operating in Local Vault mode (Environment & PostgreSQL iam.api_keys).")

    async def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """
        Retrieves a secret from Azure Key Vault or local env/database.
        """
        # 1. Try Azure Key Vault if configured
        if self.use_azure and self._client:
            try:
                sanitized_name = secret_name.replace("_", "-")
                secret = await asyncio.to_thread(self._client.get_secret, sanitized_name)
                if secret and secret.value:
                    return secret.value
            except Exception as e:
                logger.debug(f"[KeyVault] Secret '{secret_name}' not found in Azure Key Vault ({e}). Falling back to local.")

        # 2. Check local environment variables
        env_val = os.getenv(secret_name) or os.getenv(secret_name.upper()) or os.getenv(secret_name.replace("-", "_").upper())
        if env_val:
            return env_val

        # 3. Check PostgreSQL iam.api_keys
        try:
            from sqlalchemy import select
            from backend.database.connection import get_async_db
            from backend.database.models import ApiKeyRecord

            async with get_async_db() as db:
                res = await db.execute(
                    select(ApiKeyRecord).where(
                        (ApiKeyRecord.name == secret_name) | (ApiKeyRecord.id == secret_name)
                    )
                )
                record = res.scalars().first()
                if record and record.raw_key:
                    return record.raw_key
        except Exception:
            pass

        return default

    async def set_secret(self, secret_name: str, value: str) -> bool:
        """
        Sets a secret in Azure Key Vault (if active) or environment.
        """
        if self.use_azure and self._client:
            try:
                sanitized_name = secret_name.replace("_", "-")
                await asyncio.to_thread(self._client.set_secret, sanitized_name, value)
                return True
            except Exception as e:
                logger.warning(f"[KeyVault] Failed to write secret to Azure Key Vault: {e}")

        # Local environment set
        os.environ[secret_name.upper()] = value
        return True

    async def get_health(self) -> Dict[str, Any]:
        """
        Returns the operational status of the secrets manager.
        """
        if self.use_azure:
            return {
                "status": "OPERATIONAL",
                "provider": "Azure Key Vault",
                "vault_url": self.vault_url
            }
        else:
            return {
                "status": "OPERATIONAL",
                "provider": "Local Environment & PostgreSQL Vault",
                "vault_mode": "LOCAL_SECURE"
            }


# Global singleton instance
key_vault_service = AzureKeyVaultService()
