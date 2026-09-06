"""Reusable read-only HTTP adapter driven by administrator-supplied operation metadata."""
import time
import httpx
from backend.connectors.base import ConnectorAdapter, EvidenceBundle, OperationManifest


class ConfiguredHttpConnector(ConnectorAdapter):
    def describe_manifests(self):
        return [OperationManifest(
            operation_id=key, display_name=value.get("name", key),
            capability=value.get("capability", key), tool_name=key.replace(".", "_"),
            description=value.get("description", "Configured read operation"),
            input_schema=value.get("input_schema", {"type": "object"}),
            required_signals=value.get("required_signals", []), read_only=True,
        ) for key, value in self.config.get("operations", {}).items() if value.get("read_only") is True]

    async def _request(self, path, method="GET", args=None):
        base_url = getattr(self, "base_url", None) or self.config.get("base_url")
        if not base_url or not path or not path.startswith("/") or path.startswith("//"):
            raise ValueError("Configure a base URL and a relative operation path before using this connector.")
        headers = dict(self.config.get("headers", {}))
        if self.config.get("token"):
            headers["Authorization"] = f"Bearer {self.config['token']}"
        async with httpx.AsyncClient(timeout=min(float(self.config.get("timeout_seconds", 30)), 120),
                                     follow_redirects=False) as client:
            response = await client.request(method, base_url.rstrip("/") + path,
                headers=headers, params=args if method == "GET" else None,
                json=args if method == "POST" else None)
            response.raise_for_status()
            return response.json()

    async def health_check(self, environment):
        started = time.perf_counter()
        try:
            await self._request(self.config.get("health_path"))
            return {"status": "HEALTHY", "latency_ms": int((time.perf_counter() - started) * 1000)}
        except Exception as exc:
            return {"status": "UNAVAILABLE", "message": f"Health probe failed ({type(exc).__name__}). Check endpoint and credentials."}

    async def invoke_read(self, operation, args, environment, run_id, step_id=None, **kwargs):
        config = self.config.get("operations", {}).get(operation)
        if not config or config.get("read_only") is not True:
            raise ValueError("This operation has not been configured and approved as read-only.")
        method = config.get("method", "GET").upper()
        if method not in ("GET", "POST"):
            raise ValueError("Read adapters support configured GET and POST queries only.")
        data = await self._request(config.get("path"), method, args)
        return EvidenceBundle.create(run_id=run_id, connector=self.instance_key, operation=operation,
            summary="Response received from configured source.",
            raw_payload={"response": data}, observations=[{"source": self.instance_key, "data": data}],
            step_id=step_id, confidence=0.0)

    async def execute_approved(self, proposal, approval_id, delegated_identity):
        raise NotImplementedError("Register a governed write adapter to execute this action.")
