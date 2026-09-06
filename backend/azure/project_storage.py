"""
Project-Wise Artifact & Skill Storage Manager for PRISM / Sentrix Autonomous SRE Platform.
Maintains structured project directories for:
- artifacts/: Google ADK run traces, execution graphs, RCA reports, evidence bundles, action proposals.
- skills/: Project-specific skills definitions, SKILL.md instructions, parameter schemas.
- config/: Project topology, system prompts, connector bindings.
- evals/: Google ADK Quality Flywheel benchmarks and eval datasets.

Mirrors seamlessly into local ./storage/projects/<project_id>/ and Azure Blob Storage
under the 'projects' container when deployed to Azure.
"""
import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from backend.azure.blob_storage import blob_storage_service

logger = logging.getLogger("prism.azure.project_storage")

LOCAL_PROJECTS_ROOT = Path(os.getenv(
    "LOCAL_PROJECTS_STORAGE_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/projects"))
))


class ProjectStorageService:
    """
    Manages project-scoped artifacts, skills, configurations, and evaluation assets.
    """

    SUBFOLDERS = ["artifacts", "skills", "config", "evals"]

    def __init__(self):
        LOCAL_PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)

    def get_project_dir(self, project_id: str) -> Path:
        """Returns the local path for a project's storage directory."""
        clean_id = project_id.strip().replace("..", "").replace("/", "")
        p_dir = LOCAL_PROJECTS_ROOT / clean_id
        return p_dir

    def ensure_project_hierarchy(self, project_id: str) -> Path:
        """Ensures all standard subdirectories exist for a project."""
        p_dir = self.get_project_dir(project_id)
        p_dir.mkdir(parents=True, exist_ok=True)
        for sub in self.SUBFOLDERS:
            (p_dir / sub).mkdir(parents=True, exist_ok=True)
        return p_dir

    async def save_project_artifact(
        self,
        project_id: str,
        subfolder: str,
        filename: str,
        data: Union[str, bytes, dict, list],
        content_type: str = "application/json",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Saves an artifact into ./storage/projects/<project_id>/<subfolder>/<filename>
        and syncs to Azure Blob Storage under container 'projects'.
        """
        self.ensure_project_hierarchy(project_id)
        clean_sub = subfolder.strip().replace("..", "").replace("\\", "/")
        clean_file = filename.strip().replace("..", "")

        target_file = self.get_project_dir(project_id) / clean_sub / clean_file
        target_file.parent.mkdir(parents=True, exist_ok=True)

        if isinstance(data, (dict, list)):
            payload_str = json.dumps(data, indent=2, default=str)
            payload_bytes = payload_str.encode("utf-8")
        elif isinstance(data, str):
            payload_str = data
            payload_bytes = data.encode("utf-8")
        else:
            payload_bytes = data
            payload_str = None

        def _write():
            with open(target_file, "wb") as f:
                f.write(payload_bytes)

        await asyncio.to_thread(_write)
        local_path = str(target_file.resolve())

        # Dual-sync to Azure Blob Storage under 'projects' container
        blob_path = f"{project_id}/{clean_sub}/{clean_file}"
        blob_meta = metadata or {}
        blob_meta.update({
            "project_id": project_id,
            "subfolder": clean_sub,
            "filename": clean_file
        })

        azure_res = await blob_storage_service.upload_blob(
            container="projects",
            blob_name=blob_path,
            data=payload_bytes,
            content_type=content_type,
            metadata=blob_meta
        )

        return {
            "status": "SAVED",
            "project_id": project_id,
            "subfolder": clean_sub,
            "filename": clean_file,
            "size_bytes": len(payload_bytes),
            "local_path": local_path,
            "storage_sync": azure_res
        }

    async def get_project_tree(self, project_id: str) -> Dict[str, Any]:
        """
        Returns full directory tree, file counts, and byte sizes for a project.
        """
        p_dir = self.ensure_project_hierarchy(project_id)

        def _scan():
            subfolder_stats: Dict[str, Any] = {
                sub: {"file_count": 0, "total_bytes": 0, "files": []}
                for sub in self.SUBFOLDERS
            }
            total_files = 0
            total_bytes = 0

            for f in sorted(p_dir.rglob("*")):
                if f.is_file():
                    stat = f.stat()
                    rel = f.relative_to(p_dir)
                    parts = rel.parts
                    category = parts[0] if len(parts) > 1 else "root"
                    parent_rel = str(f.parent.relative_to(p_dir)) if f.parent != p_dir else ""
                    file_info = {
                        "filename": f.name,
                        "relative_path": str(rel),
                        "subfolder": parent_rel,
                        "category": category,
                        "size_bytes": stat.st_size,
                        "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                        "extension": f.suffix.lower()
                    }

                    if category in subfolder_stats:
                        subfolder_stats[category]["file_count"] += 1
                        subfolder_stats[category]["total_bytes"] += stat.st_size
                        subfolder_stats[category]["files"].append(file_info)

                    total_files += 1
                    total_bytes += stat.st_size

            return {
                "project_id": project_id,
                "local_path": str(p_dir.resolve()),
                "total_files": total_files,
                "total_bytes": total_bytes,
                "subfolders": subfolder_stats
            }

        return await asyncio.to_thread(_scan)

    async def list_project_artifacts(
        self,
        project_id: str,
        subfolder: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Lists artifacts for a project, optionally filtered by subfolder.
        """
        tree = await self.get_project_tree(project_id)
        if subfolder and subfolder in tree["subfolders"]:
            return tree["subfolders"][subfolder]["files"]

        all_files = []
        for s in self.SUBFOLDERS:
            all_files.extend(tree["subfolders"][s]["files"])
        return all_files

    def get_artifact_file_path(
        self,
        project_id: str,
        subfolder: str,
        filename: str
    ) -> Optional[Path]:
        """Returns the local path if the artifact exists."""
        clean_sub = subfolder.strip().replace("..", "").replace("\\", "/")
        clean_file = filename.strip().replace("..", "")
        f_path = self.get_project_dir(project_id) / clean_sub / clean_file
        if f_path.exists() and f_path.is_file():
            return f_path
        return None

    async def get_artifact_content(
        self,
        project_id: str,
        subfolder: str,
        filename: str
    ) -> Dict[str, Any]:
        """
        Loads the artifact content from local disk or Azure Blob Storage.
        """
        f_path = self.get_artifact_file_path(project_id, subfolder, filename)
        if not f_path:
            # Fallback to download from Azure Blob Storage
            blob_path = f"{project_id}/{subfolder}/{filename}"
            raw = await blob_storage_service.download_blob("projects", blob_path)
            content_str = raw.decode("utf-8")
        else:
            def _read():
                with open(f_path, "rb") as f:
                    return f.read()
            raw = await asyncio.to_thread(_read)
            content_str = raw.decode("utf-8")

        # Try parsing JSON if applicable
        parsed_json = None
        if filename.endswith(".json"):
            try:
                parsed_json = json.loads(content_str)
            except Exception:
                pass

        return {
            "project_id": project_id,
            "subfolder": subfolder,
            "filename": filename,
            "size_bytes": len(raw),
            "content_str": content_str,
            "parsed_json": parsed_json,
            "is_json": parsed_json is not None
        }

    async def save_project_adk_artifacts(
        self,
        project_id: str,
        run_id: str,
        rca_report: str,
        execution_trace: Dict[str, Any],
        action_proposals: List[Dict[str, Any]],
        eval_metrics: Dict[str, Any],
        evidence_bundle: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Stores the complete Google ADK Run Artifact Suite in:
        ./storage/projects/<project_id>/artifacts/<run_id>/
        """
        run_folder = f"artifacts/{run_id}"

        # 1. RCA Markdown Report
        rca_res = await self.save_project_artifact(
            project_id=project_id,
            subfolder=run_folder,
            filename="rca_report.md",
            data=rca_report,
            content_type="text/markdown"
        )

        # 2. Google ADK State Graph & Execution Trace
        trace_res = await self.save_project_artifact(
            project_id=project_id,
            subfolder=run_folder,
            filename="adk_run_graph.json",
            data=execution_trace,
            content_type="application/json"
        )

        # 3. Action Proposals Bundle
        proposals_res = await self.save_project_artifact(
            project_id=project_id,
            subfolder=run_folder,
            filename="action_proposals.json",
            data=action_proposals,
            content_type="application/json"
        )

        # 4. ADK Quality Flywheel Evaluation Metrics
        eval_res = await self.save_project_artifact(
            project_id=project_id,
            subfolder=run_folder,
            filename="adk_eval_metrics.json",
            data=eval_metrics,
            content_type="application/json"
        )

        # 5. Evidence Bundle (if provided)
        evidence_res = None
        if evidence_bundle:
            evidence_res = await self.save_project_artifact(
                project_id=project_id,
                subfolder=run_folder,
                filename="evidence_bundle.json",
                data=evidence_bundle,
                content_type="application/json"
            )

        logger.info(f"[ProjectStorage] Saved ADK artifacts for project '{project_id}', run '{run_id}'")
        return {
            "status": "SUCCESS",
            "project_id": project_id,
            "run_id": run_id,
            "artifacts_folder": str(self.get_project_dir(project_id) / run_folder),
            "files_saved": [
                "rca_report.md",
                "adk_run_graph.json",
                "action_proposals.json",
                "adk_eval_metrics.json",
                *(["evidence_bundle.json"] if evidence_bundle else [])
            ]
        }



# Global singleton instance
project_storage = ProjectStorageService()
