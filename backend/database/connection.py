"""
Database connection and session management for PRISM.
Supports both asynchronous (asyncpg) and synchronous (psycopg) SQLAlchemy engines.
"""
import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL_SYNC = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql+psycopg://kbk@localhost:5432/prism_db"
)
DATABASE_URL_ASYNC = os.getenv(
    "DATABASE_URL_ASYNC",
    "postgresql+asyncpg://kbk@localhost:5432/prism_db"
)

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
    from sqlalchemy import text
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT current_database(), current_user, version()"))
            row = result.fetchone()
            return {
                "status": "HEALTHY",
                "database": row[0],
                "user": row[1],
                "version": row[2]
            }
    except Exception as exc:
        return {
            "status": "DOWN",
            "error": str(exc)
        }
