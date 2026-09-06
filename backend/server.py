"""
Sentrix Backend Server Application.
Combines FastAPI REST/SSE endpoints, CORS configuration, and database connection checks.
"""
import sys
from pathlib import Path

# Ensure project root directory is on sys.path so 'backend.*' imports resolve cleanly
_root_dir = str(Path(__file__).resolve().parent.parent)
if _root_dir not in sys.path:
    sys.path.insert(0, _root_dir)

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router as api_router
from backend.api.organizations import router as organizations_router
from backend.api.harness_configuration import router as harness_configuration_router
from backend.database.connection import check_db_health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentrix.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Sentrix Autonomous SRE & Telemetry Platform...")
    db_health = await check_db_health()
    logger.info(f"PostgreSQL Database Health: {db_health}")
    # Initialize Sentrix Agent Harness Microkernel (Everything is a Plugin)
    from backend.harness.plugin_registry import HarnessPluginRegistry
    await HarnessPluginRegistry.initialize_defaults()
    yield
    logger.info("Shutting down Sentrix Platform.")


app = FastAPI(
    title="Sentrix - Autonomous SRE & Telemetry Platform",
    description="Governed investigation, autonomous multi-tool triaging, and action execution platform.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for the frontend Vite development and production servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(organizations_router)
app.include_router(harness_configuration_router)


@app.get("/health")
@app.get("/api/health")
async def health():
    db_status = await check_db_health()
    return {
        "status": "UP",
        "platform": "Sentrix v2.0",
        "adk_version": "2.8.0",
        "database": db_status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=[str(Path(__file__).resolve().parent)])
