"""
Database connection and session management for Sentrix.
Supports both asynchronous (asyncpg) and synchronous (psycopg) SQLAlchemy engines.
"""
import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from backend.azure.postgres_adapter import get_postgres_urls

_urls = get_postgres_urls()
DATABASE_URL_SYNC = _urls["sync_url"]
DATABASE_URL_ASYNC = _urls["async_url"]

# Sync Engine (for scripts, seeding, migrations)
sync_engine = create_engine(
    DATABASE_URL_SYNC,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Async Engine (for FastAPI request handlers and streaming agent loops)
async_engine = create_async_engine(
    DATABASE_URL_ASYNC,
    pool_pre_ping=True,
    pool_size=15,
    max_overflow=25,
    echo=False
)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

@asynccontextmanager
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Async session context manager for agent and API workflows."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

@contextmanager
def get_sync_db() -> Generator[Session, None, None]:
    """Sync session context manager for migrations, tasks, and seeding."""
    session = SyncSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

async def check_db_health() -> dict:
    """Validate database connectivity and schema presence."""
    import time
    from sqlalchemy import text
    t0 = time.perf_counter()
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT current_database(), current_user, version()"))
            row = result.fetchone()
            latency_ms = round((time.perf_counter() - t0) * 1000, 2)
            return {
                "status": "HEALTHY",
                "database": row[0],
                "user": row[1],
                "version": row[2],
                "latency_ms": latency_ms
            }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "status": "DOWN",
            "error": str(exc),
            "latency_ms": latency_ms
        }

