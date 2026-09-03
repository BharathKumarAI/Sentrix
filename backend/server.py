"""
PRISM Backend Server Application.
Combines FastAPI REST/SSE endpoints, CORS configuration, and database connection checks.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router as api_router
from backend.database.connection import check_db_health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("prism.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PRISM AI Investigation & Analysis Platform...")
    db_health = await check_db_health()
    logger.info(f"PostgreSQL Database Health: {db_health}")
    yield
    logger.info("Shutting down PRISM Platform.")


app = FastAPI(
    title="PRISM - AI Investigation & Analysis Platform",
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


@app.get("/health")
async def health():
    db_status = await check_db_health()
    return {
        "status": "UP",
        "platform": "PRISM v2.0",
        "adk_version": "2.8.0",
        "database": db_status
    }
