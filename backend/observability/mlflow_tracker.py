"""
MLflow Observability, Skill Validation & Prompt Experiment Tracker for PRISM.
Logs runs, latencies, evidence metrics, and token usage into MLflow tracking stores.
Enables quantitative validation of new skills and prompts against historical baselines.
"""
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import mlflow

logger = logging.getLogger("prism.observability.mlflow")

os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"
MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db")
EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT_NAME", "sentrix_sre_platform")


class MLflowTracker:
    """Manages skill evaluation and prompt version tracking via MLflow."""

    _initialized = False

    @classmethod
    def configure(
        cls,
        tracking_uri: Optional[str] = None,
        experiment_name: Optional[str] = None,
        tracking_token: Optional[str] = None,
        artifact_root: Optional[str] = None
    ):
        """Dynamically reconfigures MLflow tracker destination and re-initializes tracking client."""
        global MLFLOW_URI, EXPERIMENT_NAME
        if tracking_uri:
            MLFLOW_URI = tracking_uri
            os.environ["MLFLOW_TRACKING_URI"] = tracking_uri
        if experiment_name:
            EXPERIMENT_NAME = experiment_name
            os.environ["MLFLOW_EXPERIMENT_NAME"] = experiment_name
        if tracking_token:
            os.environ["MLFLOW_TRACKING_TOKEN"] = tracking_token
        if artifact_root:
            os.environ["MLFLOW_DEFAULT_ARTIFACT_ROOT"] = artifact_root

        cls._initialized = False
        cls._ensure_initialized()
        logger.info(f"[MLflow] Reconfigured tracking to {MLFLOW_URI} (Experiment: {EXPERIMENT_NAME})")

    @classmethod
    def _ensure_initialized(cls):
        if not cls._initialized:
            try:
                mlflow.set_tracking_uri(MLFLOW_URI)
                exp = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
                if not exp:
                    mlflow.create_experiment(
                        name=EXPERIMENT_NAME,
                        tags={"platform": "Sentrix", "version": "2.8.0", "engine": "Google ADK"}
                    )
                mlflow.set_experiment(EXPERIMENT_NAME)
                cls._initialized = True
                logger.info(f"[MLflow] Initialized tracking at {MLFLOW_URI} (Experiment: {EXPERIMENT_NAME})")
            except Exception as e:
                logger.warning(f"[MLflow] Could not initialize experiment: {e}")

    @classmethod
    def track_skill_execution(
        cls,
        skill_key: str,
        skill_name: str,
        parameters: Dict[str, Any],
        latency_ms: float,
        status: str = "SUCCESS",
        evidence_count: int = 0,
        coverage_score: float = 1.0,
        run_id: Optional[str] = None
    ) -> Optional[str]:
        """Logs an autonomous skill execution as an MLflow run."""
        cls._ensure_initialized()
        try:
            with mlflow.start_run(run_name=f"skill:{skill_key}", nested=True) as run:
                mlflow.set_tag("entity_type", "skill")
                mlflow.set_tag("skill_key", skill_key)
                mlflow.set_tag("skill_name", skill_name)
                mlflow.set_tag("status", status)
                if run_id:
                    mlflow.set_tag("prism_run_id", run_id)

                # Log parameters (flattened or truncated)
                for k, v in parameters.items():
                    mlflow.log_param(f"param_{k}", str(v)[:100])

                # Log evaluation metrics
                mlflow.log_metric("latency_ms", latency_ms)
                mlflow.log_metric("evidence_count", evidence_count)
                mlflow.log_metric("coverage_score", coverage_score)
                mlflow.log_metric("is_success", 1.0 if status == "SUCCESS" else 0.0)

                return run.info.run_id
        except Exception as e:
            logger.debug(f"[MLflow] Failed to log skill execution: {e}")
            return None

    @classmethod
    def track_prompt_evaluation(
        cls,
        prompt_name: str,
        version: int,
        category: str,
        latency_ms: float,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        quality_score: float = 0.95
    ) -> Optional[str]:
        """Logs a prompt template invocation and token evaluation."""
        cls._ensure_initialized()
        try:
            with mlflow.start_run(run_name=f"prompt:{prompt_name}:v{version}", nested=True) as run:
                mlflow.set_tag("entity_type", "prompt")
                mlflow.set_tag("prompt_name", prompt_name)
                mlflow.set_tag("version", str(version))
                mlflow.set_tag("category", category)

                mlflow.log_metric("latency_ms", latency_ms)
                mlflow.log_metric("prompt_tokens", prompt_tokens)
                mlflow.log_metric("completion_tokens", completion_tokens)
                mlflow.log_metric("quality_score", quality_score)

                return run.info.run_id
        except Exception as e:
            logger.debug(f"[MLflow] Failed to log prompt evaluation: {e}")
            return None

    @classmethod
    def get_recent_runs(cls, limit: int = 15) -> List[Dict[str, Any]]:
        """Queries recent MLflow runs for the Admin dashboard."""
        cls._ensure_initialized()
        try:
            exp = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
            if not exp:
                return []
            runs = mlflow.search_runs(
                experiment_ids=[exp.experiment_id],
                max_results=limit,
                order_by=["start_time DESC"]
            )
            results = []
            for _, r in runs.iterrows():
                results.append({
                    "run_id": r.get("run_id"),
                    "run_name": r.get("tags.mlflow.runName", "unnamed"),
                    "entity_type": r.get("tags.entity_type", "unknown"),
                    "status": r.get("status", "FINISHED"),
                    "latency_ms": r.get("metrics.latency_ms", 0),
                    "start_time": r.get("start_time").isoformat() if hasattr(r.get("start_time"), "isoformat") else str(r.get("start_time")),
                })
            return results
        except Exception as e:
            logger.debug(f"[MLflow] Search runs exception: {e}")
            return []

    @classmethod
    def get_health(cls) -> Dict[str, Any]:
        """Returns MLflow tracking health status."""
        cls._ensure_initialized()
        try:
            exp = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
            return {
                "status": "HEALTHY" if cls._initialized else "DEGRADED",
                "tracking_uri": MLFLOW_URI,
                "experiment_name": EXPERIMENT_NAME,
                "experiment_id": exp.experiment_id if exp else None,
                "version": mlflow.__version__
            }
        except Exception as exc:
            return {"status": "DOWN", "error": str(exc), "tracking_uri": MLFLOW_URI}
