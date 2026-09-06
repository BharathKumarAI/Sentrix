"""
Azure Blob Storage Service with Seamless Local Filesystem Fallback.
When AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME is set,
it communicates with real Azure Blob Storage containers.
When running locally without Azure credentials, it seamlessly mirrors the identical
container and blob structure in ./storage/blobs/.
"""
import asyncio
import hashlib
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("prism.azure.blob_storage")

LOCAL_BLOB_ROOT = Path(os.getenv("LOCAL_BLOB_STORAGE_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/blobs"))))


class AzureBlobStorageService:
    """
    Unified Object Storage Adapter for Azure Blob Storage & Local Filesystem.
    """

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
        self.account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
        self.use_azure = bool(self.connection_string or (self.account_name and self.account_key))
        self._client = None

        if self.use_azure:
            try:
                from azure.storage.blob import BlobServiceClient
                if self.connection_string:
                    self._client = BlobServiceClient.from_connection_string(self.connection_string)
                else:
                    account_url = f"https://{self.account_name}.blob.core.windows.net"
                    self._client = BlobServiceClient(account_url=account_url, credential=self.account_key)
                logger.info(f"[BlobStorage] Connected to Azure Blob Storage account: {self.account_name or 'custom-connection'}")
            except Exception as e:
                logger.warning(f"[BlobStorage] Failed to initialize Azure SDK client, falling back to local storage: {e}")
                self.use_azure = False

        if not self.use_azure:
            LOCAL_BLOB_ROOT.mkdir(parents=True, exist_ok=True)
            logger.info(f"[BlobStorage] Initialized Local Filesystem Blob Storage at: {LOCAL_BLOB_ROOT}")

    async def upload_blob(
        self,
        container: str,
        blob_name: str,
        data: bytes | str,
        content_type: str = "application/json",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Uploads an object to Azure Blob Storage or local storage mirror.
        """
        if isinstance(data, str):
            payload_bytes = data.encode("utf-8")
        else:
            payload_bytes = data

        content_hash = hashlib.sha256(payload_bytes).hexdigest()
        now = datetime.now(timezone.utc)

        # Always write to local mirror folder so the local folder reflects properly
        target_dir = LOCAL_BLOB_ROOT / container
        target_dir.mkdir(parents=True, exist_ok=True)
        target_file = target_dir / blob_name
        target_file.parent.mkdir(parents=True, exist_ok=True)

        def _write_local():
            with open(target_file, "wb") as f:
                f.write(payload_bytes)

        await asyncio.to_thread(_write_local)
        local_path = str(target_file.resolve())

        if self.use_azure and self._client:
            def _upload_azure():
                container_client = self._client.get_container_client(container)
                if not container_client.exists():
                    container_client.create_container()
                blob_client = container_client.get_blob_client(blob_name)
                blob_client.upload_blob(
                    payload_bytes,
                    overwrite=True,
                    content_type=content_type,
                    metadata=metadata or {}
                )
                return blob_client.url

            try:
                blob_url = await asyncio.to_thread(_upload_azure)
                return {
                    "provider": "AzureBlobStorage",
                    "container": container,
                    "blob_name": blob_name,
                    "size_bytes": len(payload_bytes),
                    "content_hash": content_hash,
                    "url": blob_url,
                    "local_mirror_path": local_path,
                    "created_at": now.isoformat()
                }
            except Exception as e:
                logger.warning(f"[BlobStorage] Azure upload failed ({e}), preserved in local mirror: {local_path}")
                return {
                    "provider": "LocalFileSystemMirror",
                    "container": container,
                    "blob_name": blob_name,
                    "size_bytes": len(payload_bytes),
                    "content_hash": content_hash,
                    "path": local_path,
                    "url": f"file://{local_path}",
                    "azure_error": str(e),
                    "created_at": now.isoformat()
                }
        else:
            return {
                "provider": "LocalFileSystem",
                "container": container,
                "blob_name": blob_name,
                "size_bytes": len(payload_bytes),
                "content_hash": content_hash,
                "path": local_path,
                "url": f"file://{local_path}",
                "created_at": now.isoformat()
            }

    async def download_blob(self, container: str, blob_name: str) -> bytes:
        """
        Downloads blob bytes from Azure or local storage mirror.
        """
        if self.use_azure and self._client:
            def _download_azure():
                container_client = self._client.get_container_client(container)
                blob_client = container_client.get_blob_client(blob_name)
                return blob_client.download_blob().readall()

            return await asyncio.to_thread(_download_azure)
        else:
            target_file = LOCAL_BLOB_ROOT / container / blob_name
            if not target_file.exists():
                raise FileNotFoundError(f"Blob '{blob_name}' not found in container '{container}'")

            def _read_local():
                with open(target_file, "rb") as f:
                    return f.read()

            return await asyncio.to_thread(_read_local)

    async def list_blobs(self, container: str, prefix: str = "") -> List[Dict[str, Any]]:
        """
        Lists blobs in a container.
        """
        if self.use_azure and self._client:
            def _list_azure():
                container_client = self._client.get_container_client(container)
                if not container_client.exists():
                    return []
                blobs = container_client.list_blobs(name_starts_with=prefix)
                return [
                    {
                        "name": b.name,
                        "size_bytes": b.size,
                        "content_type": b.content_settings.content_type if b.content_settings else None,
                        "last_modified": b.last_modified.isoformat() if b.last_modified else None
                    }
                    for b in blobs
                ]

            return await asyncio.to_thread(_list_azure)
        else:
            container_dir = LOCAL_BLOB_ROOT / container
            if not container_dir.exists():
                return []

            results = []
            for path in container_dir.rglob("*"):
                if path.is_file():
                    rel_name = str(path.relative_to(container_dir))
                    if not prefix or rel_name.startswith(prefix):
                        stat = path.stat()
                        results.append({
                            "name": rel_name,
                            "size_bytes": stat.st_size,
                            "last_modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
                        })
            return results

    async def delete_blob(self, container: str, blob_name: str) -> bool:
        """
        Deletes a blob from Azure or local storage.
        """
        if self.use_azure and self._client:
            def _delete_azure():
                container_client = self._client.get_container_client(container)
                blob_client = container_client.get_blob_client(blob_name)
                if blob_client.exists():
                    blob_client.delete_blob()
                    return True
                return False

            return await asyncio.to_thread(_delete_azure)
        else:
            target_file = LOCAL_BLOB_ROOT / container / blob_name
            if target_file.exists():
                target_file.unlink()
                return True
            return False

    async def get_health(self) -> Dict[str, Any]:
        """
        Returns the operational status of the blob storage provider.
        """
        local_stats = await self.get_local_folder_stats()
        if self.use_azure:
            return {
                "status": "OPERATIONAL",
                "provider": "Azure Blob Storage",
                "account": self.account_name or "ConnectionString-Defined",
                "storage_mode": "CLOUD_BLOB_WITH_LOCAL_MIRROR",
                "local_mirror_path": str(LOCAL_BLOB_ROOT),
                "local_mirrored_files": local_stats["total_files"],
                "local_mirrored_bytes": local_stats["total_bytes"]
            }
        else:
            return {
                "status": "OPERATIONAL",
                "provider": "Local Filesystem Mirror",
                "storage_mode": "LOCAL_MIRROR",
                "root_path": str(LOCAL_BLOB_ROOT),
                "total_files": local_stats["total_files"],
                "total_bytes": local_stats["total_bytes"]
            }

    async def list_local_files(self) -> List[Dict[str, Any]]:
        """
        Recursively lists all files stored in the local blob mirror directory.
        """
        def _scan():
            items = []
            if not LOCAL_BLOB_ROOT.exists():
                return items
            for p in sorted(LOCAL_BLOB_ROOT.rglob("*")):
                if p.is_file():
                    stat = p.stat()
                    rel_path = str(p.relative_to(LOCAL_BLOB_ROOT))
                    container = rel_path.split(os.sep)[0] if os.sep in rel_path else "root"
                    items.append({
                        "container": container,
                        "relative_path": rel_path,
                        "filename": p.name,
                        "size_bytes": stat.st_size,
                        "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                        "local_absolute_path": str(p.resolve())
                    })
            return items

        return await asyncio.to_thread(_scan)

    async def get_local_folder_stats(self) -> Dict[str, Any]:
        """
        Returns file count, byte size, and container distribution of local storage mirror.
        """
        files = await self.list_local_files()
        total_bytes = sum(f["size_bytes"] for f in files)
        containers: Dict[str, int] = {}
        for f in files:
            c = f["container"]
            containers[c] = containers.get(c, 0) + 1

        return {
            "root_path": str(LOCAL_BLOB_ROOT),
            "total_files": len(files),
            "total_bytes": total_bytes,
            "container_counts": containers
        }

    def reconfigure(
        self,
        connection_string: Optional[str] = None,
        account_name: Optional[str] = None,
        account_key: Optional[str] = None
    ):
        """
        Reconfigures Azure Blob Storage connection credentials at runtime.
        """
        if connection_string is not None:
            self.connection_string = connection_string
            os.environ["AZURE_STORAGE_CONNECTION_STRING"] = connection_string
        if account_name is not None:
            self.account_name = account_name
            os.environ["AZURE_STORAGE_ACCOUNT_NAME"] = account_name
        if account_key is not None:
            self.account_key = account_key
            os.environ["AZURE_STORAGE_ACCOUNT_KEY"] = account_key

        self.use_azure = bool(self.connection_string or (self.account_name and self.account_key))
        self._client = None

        if self.use_azure:
            try:
                from azure.storage.blob import BlobServiceClient
                if self.connection_string:
                    self._client = BlobServiceClient.from_connection_string(self.connection_string)
                else:
                    account_url = f"https://{self.account_name}.blob.core.windows.net"
                    self._client = BlobServiceClient(account_url=account_url, credential=self.account_key)
                logger.info(f"[BlobStorage] Reconfigured Azure Blob Storage account: {self.account_name or 'custom'}")
            except Exception as e:
                logger.warning(f"[BlobStorage] Reconfigure failed ({e}), falling back to local storage.")
                self.use_azure = False


# Global singleton instance
blob_storage_service = AzureBlobStorageService()

