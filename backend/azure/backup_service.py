"""
Automated Backup Service for PRISM / Sentrix Platform.
Backs up all critical database tables, execution histories, knowledge nodes, and admin configurations.
Saves backups to the local ./storage/backups/ folder AND synchronizes to Azure Blob Storage
under the 'backups' container.
"""
import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy import text

from backend.azure.blob_storage import blob_storage_service

logger = logging.getLogger("prism.azure.backup")

LOCAL_BACKUP_DIR = Path(os.getenv("LOCAL_BACKUP_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/backups"))))


class AzureBackupService:
    """
    Automated Backup & Disaster Recovery Service.
    Seamlessly writes to local ./storage/backups/ and mirrors to Azure Blob Storage.
    """

    def __init__(self):
        LOCAL_BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    async def create_full_backup(self, description: str = "Manual Admin Snapshot") -> Dict[str, Any]:
        """
        Exports all platform tables, row counts, and data snapshots to JSON,
        persisting locally and uploading to Azure Blob Storage.
        """
        now = datetime.now(timezone.utc)
        timestamp_str = now.strftime("%Y%m%d_%H%M%S")
        backup_filename = f"sentrix_backup_{timestamp_str}.json"

        tables_to_export = [
            ("control_plane", "prompt_templates"),
            ("control_plane", "model_providers"),
            ("control_plane", "security_policies"),
            ("control_plane", "skill_definitions"),
            ("iam", "users"),
            ("iam", "api_keys"),
            ("runtime", "projects"),
            ("runtime", "runs"),
            ("runtime", "action_proposals"),
            ("audit_analytics", "audit_events"),
            ("okf_knowledge", "knowledge_nodes"),
        ]

        backup_payload: Dict[str, Any] = {
            "backup_version": "2.0.0",
            "timestamp": now.isoformat(),
            "description": description,
            "tables": {}
        }

        total_rows = 0

        from backend.database.connection import get_async_db
        async with get_async_db() as db:
            for schema, table in tables_to_export:
                try:
                    res = await db.execute(text(f"SELECT * FROM {schema}.{table};"))
                    columns = res.keys()
                    rows = []
                    for r in res.fetchall():
                        row_dict = {}
                        for idx, col in enumerate(columns):
                            val = r[idx]
                            if isinstance(val, datetime):
                                row_dict[col] = val.isoformat()
                            elif hasattr(val, "hex"):
                                row_dict[col] = str(val)
                            else:
                                row_dict[col] = val
                        rows.append(row_dict)

                    backup_payload["tables"][f"{schema}.{table}"] = {
                        "row_count": len(rows),
                        "data": rows
                    }
                    total_rows += len(rows)
                except Exception as e:
                    logger.debug(f"[Backup] Skipping table {schema}.{table}: {e}")

        # Compute deterministic checksum
        serialized = json.dumps(backup_payload, indent=2, default=str)
        checksum = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        backup_payload["sha256_checksum"] = checksum
        backup_payload["total_rows_exported"] = total_rows

        # 1. Save to local folder
        local_file_path = LOCAL_BACKUP_DIR / backup_filename
        with open(local_file_path, "w", encoding="utf-8") as f:
            f.write(serialized)

        logger.info(f"[Backup] Created local backup file: {local_file_path} ({total_rows} rows)")

        # 2. Upload to Azure Blob Storage (or local mirror)
        blob_result = await blob_storage_service.upload_blob(
            container="backups",
            blob_name=backup_filename,
            data=serialized,
            content_type="application/json",
            metadata={"description": description, "rows": str(total_rows)}
        )

        return {
            "status": "SUCCESS",
            "backup_filename": backup_filename,
            "total_rows": total_rows,
            "size_bytes": len(serialized.encode("utf-8")),
            "sha256": checksum,
            "local_path": str(local_file_path),
            "storage": blob_result
        }

    async def list_backups(self) -> List[Dict[str, Any]]:
        """
        Lists all available backups in the local directory and storage mirror with rich metadata.
        """
        backups = []
        if LOCAL_BACKUP_DIR.exists():
            for f in sorted(LOCAL_BACKUP_DIR.glob("*.json"), reverse=True):
                stat = f.stat()
                desc = "Manual Snapshot"
                rows_count = 0
                checksum = ""
                try:
                    with open(f, "rb") as bf:
                        raw_bytes = bf.read()
                        checksum = hashlib.sha256(raw_bytes).hexdigest()
                        data = json.loads(raw_bytes.decode("utf-8"))
                        desc = data.get("description", desc)
                        rows_count = data.get("total_rows_exported")
                        if rows_count is None and "tables" in data:
                            rows_count = sum(
                                t.get("row_count", len(t.get("data", [])))
                                for t in data["tables"].values()
                                if isinstance(t, dict)
                            )
                        if data.get("sha256_checksum"):
                            checksum = data["sha256_checksum"]
                except Exception:
                    pass

                backups.append({
                    "filename": f.name,
                    "size_bytes": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                    "local_path": str(f.resolve()),
                    "description": desc,
                    "total_rows": rows_count or 0,
                    "sha256": checksum
                })
        return backups

    def get_backup_path(self, filename: str) -> Optional[Path]:
        """Returns local path for a backup file if it exists."""
        safe_name = os.path.basename(filename)
        path = LOCAL_BACKUP_DIR / safe_name
        if path.exists() and path.is_file():
            return path
        return None

    async def get_backup_content(self, filename: str) -> Dict[str, Any]:
        """Loads backup payload from local folder or Azure Blob Storage."""
        local_file = self.get_backup_path(filename)
        if local_file:
            with open(local_file, "r", encoding="utf-8") as f:
                return json.load(f)
        raw_bytes = await blob_storage_service.download_blob("backups", filename)
        return json.loads(raw_bytes.decode("utf-8"))

    async def restore_backup(self, filename: str) -> Dict[str, Any]:
        """
        Restores table data from a specified backup snapshot.
        Upserts rows by primary key into PostgreSQL tables.
        """
        payload = await self.get_backup_content(filename)
        tables = payload.get("tables", {})
        if not tables:
            raise ValueError("Backup file contains no valid table data")

        restored_stats = {}
        total_restored = 0

        from backend.database.connection import get_async_db
        async with get_async_db() as db:
            for full_table_name, table_info in tables.items():
                if "." not in full_table_name:
                    continue
                schema, table = full_table_name.split(".", 1)
                rows = table_info.get("data", [])
                if not rows:
                    continue

                col_names = list(rows[0].keys())
                placeholders = ", ".join([f":{c}" for c in col_names])
                cols_str = ", ".join([f'"{c}"' for c in col_names])

                if "id" in col_names and len(col_names) > 1:
                    update_assignments = ", ".join([f'"{c}" = EXCLUDED."{c}"' for c in col_names if c != "id"])
                    upsert_sql = f"""
                    INSERT INTO {schema}.{table} ({cols_str})
                    VALUES ({placeholders})
                    ON CONFLICT (id) DO UPDATE SET {update_assignments};
                    """
                else:
                    upsert_sql = f"""
                    INSERT INTO {schema}.{table} ({cols_str})
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING;
                    """

                try:
                    for row in rows:
                        # Convert dicts/lists to JSON strings, and parse ISO datetime strings for asyncpg
                        param_row = {}
                        for k, v in row.items():
                            if isinstance(v, (dict, list)):
                                param_row[k] = json.dumps(v)
                            elif isinstance(v, str) and (
                                k.endswith("_at") or k in ("time_stamp", "last_login", "timestamp", "deleted_at")
                            ):
                                try:
                                    param_row[k] = datetime.fromisoformat(v)
                                except Exception:
                                    param_row[k] = v
                            elif isinstance(v, str) and (k.endswith("_ms") or k in ("duration", "latency")):
                                try:
                                    param_row[k] = float(v)
                                except Exception:
                                    param_row[k] = v
                            else:
                                param_row[k] = v
                        await db.execute(text(upsert_sql), param_row)
                    await db.commit()
                    restored_stats[full_table_name] = len(rows)
                    total_restored += len(rows)
                except Exception as e:
                    logger.warning(f"[Restore] Could not restore {full_table_name}: {e}")
                    restored_stats[full_table_name] = f"Error: {e}"

        return {
            "status": "RESTORE_COMPLETE",
            "filename": filename,
            "total_rows_restored": total_restored,
            "tables_restored": restored_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global singleton instance
backup_service = AzureBackupService()
