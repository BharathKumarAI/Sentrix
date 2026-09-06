"""
Azure Cache for Redis Service with Seamless In-Memory Fallback.
Supports Azure Cache for Redis (TLS 6380, rediss://) when deployed to Azure.
When running locally or when Redis is unreachable, seamlessly provides a high-performance,
thread-safe in-memory cache with TTL support and zero external dependency failures.
"""
import asyncio
import json
import logging
import os
import time
from typing import Any, Dict, Optional

logger = logging.getLogger("prism.azure.redis_cache")


class InMemoryCache:
    """Thread-safe In-Memory Cache with TTL expiration."""

    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[str]:
        async with self._lock:
            if key in self._expiry and time.time() > self._expiry[key]:
                del self._store[key]
                del self._expiry[key]
                return None
            return self._store.get(key)

    async def set(self, key: str, value: str, expire_seconds: Optional[int] = None) -> bool:
        async with self._lock:
            self._store[key] = value
            if expire_seconds:
                self._expiry[key] = time.time() + expire_seconds
            elif key in self._expiry:
                del self._expiry[key]
            return True

    async def delete(self, key: str) -> bool:
        async with self._lock:
            existed = key in self._store
            self._store.pop(key, None)
            self._expiry.pop(key, None)
            return existed

    async def exists(self, key: str) -> bool:
        val = await self.get(key)
        return val is not None

    async def flush(self) -> bool:
        async with self._lock:
            self._store.clear()
            self._expiry.clear()
            return True

    def count(self) -> int:
        return len(self._store)


class AzureRedisCacheService:
    """
    Unified Cache Service for Azure Cache for Redis & Local In-Memory Storage.
    """

    def __init__(self):
        self.redis_url = os.getenv("AZURE_REDIS_CONNECTION_STRING") or os.getenv("REDIS_URL")
        self.redis_host = os.getenv("AZURE_REDIS_HOST")
        self.redis_password = os.getenv("AZURE_REDIS_PASSWORD")
        self.redis_port = int(os.getenv("AZURE_REDIS_PORT", "6380"))
        self.redis_ssl = os.getenv("AZURE_REDIS_SSL", "true").lower() == "true"
        
        self.use_redis = False
        self._redis_client = None
        self._in_memory = InMemoryCache()
        self._initialized = False

    async def _ensure_client(self):
        if self._initialized:
            return

        if self.redis_url or self.redis_host:
            try:
                import redis.asyncio as aioredis
                if self.redis_url:
                    self._redis_client = aioredis.from_url(
                        self.redis_url,
                        decode_responses=True,
                        socket_timeout=2.0
                    )
                else:
                    self._redis_client = aioredis.Redis(
                        host=self.redis_host,
                        port=self.redis_port,
                        password=self.redis_password,
                        ssl=self.redis_ssl,
                        decode_responses=True,
                        socket_timeout=2.0
                    )
                # Test connectivity
                await self._redis_client.ping()
                self.use_redis = True
                logger.info(f"[RedisCache] Successfully connected to Azure Redis at {self.redis_host or 'connection-url'}")
            except Exception as e:
                logger.warning(f"[RedisCache] Could not connect to Redis ({e}). Using robust In-Memory Cache fallback.")
                self.use_redis = False
                self._redis_client = None
        else:
            logger.info("[RedisCache] No Redis connection string found. Operating in Local In-Memory Cache mode.")
            self.use_redis = False

        self._initialized = True

    async def get(self, key: str) -> Optional[str]:
        await self._ensure_client()
        if self.use_redis and self._redis_client:
            try:
                return await self._redis_client.get(key)
            except Exception as e:
                logger.warning(f"[RedisCache] Redis GET failed: {e}. Falling back to in-memory.")
                return await self._in_memory.get(key)
        return await self._in_memory.get(key)

    async def get_json(self, key: str) -> Optional[Any]:
        raw = await self.get(key)
        if raw:
            try:
                return json.loads(raw)
            except Exception:
                return raw
        return None

    async def set(self, key: str, value: str, expire_seconds: Optional[int] = None) -> bool:
        await self._ensure_client()
        if self.use_redis and self._redis_client:
            try:
                if expire_seconds:
                    await self._redis_client.setex(key, expire_seconds, value)
                else:
                    await self._redis_client.set(key, value)
                return True
            except Exception as e:
                logger.warning(f"[RedisCache] Redis SET failed: {e}. Falling back to in-memory.")
                return await self._in_memory.set(key, value, expire_seconds)
        return await self._in_memory.set(key, value, expire_seconds)

    async def set_json(self, key: str, value: Any, expire_seconds: Optional[int] = None) -> bool:
        encoded = json.dumps(value)
        return await self.set(key, encoded, expire_seconds)

    async def delete(self, key: str) -> bool:
        await self._ensure_client()
        if self.use_redis and self._redis_client:
            try:
                res = await self._redis_client.delete(key)
                return bool(res)
            except Exception:
                return await self._in_memory.delete(key)
        return await self._in_memory.delete(key)

    async def exists(self, key: str) -> bool:
        await self._ensure_client()
        if self.use_redis and self._redis_client:
            try:
                res = await self._redis_client.exists(key)
                return bool(res)
            except Exception:
                return await self._in_memory.exists(key)
        return await self._in_memory.exists(key)

    async def get_health(self) -> Dict[str, Any]:
        await self._ensure_client()
        start = time.time()
        if self.use_redis and self._redis_client:
            try:
                await self._redis_client.ping()
                latency_ms = int((time.time() - start) * 1000)
                return {
                    "status": "OPERATIONAL",
                    "provider": "Azure Cache for Redis",
                    "host": self.redis_host or "Connection-String",
                    "ssl": self.redis_ssl,
                    "latency": f"{latency_ms}ms"
                }
            except Exception as e:
                return {
                    "status": "DEGRADED",
                    "provider": "Azure Cache for Redis (Fallback Active)",
                    "error": str(e),
                    "fallback": "In-Memory Local Grid"
                }
        else:
            return {
                "status": "OPERATIONAL",
                "provider": "Local In-Memory Cache Grid",
                "active_keys": self._in_memory.count(),
                "latency": "<1ms"
            }

    async def reconfigure(
        self,
        redis_host: Optional[str] = None,
        redis_port: Optional[int] = None,
        redis_password: Optional[str] = None,
        redis_ssl: Optional[bool] = None,
        redis_url: Optional[str] = None
    ):
        """
        Reconfigures Redis connection parameters at runtime.
        """
        if redis_host is not None:
            self.redis_host = redis_host
            os.environ["AZURE_REDIS_HOST"] = redis_host
        if redis_port is not None:
            self.redis_port = redis_port
            os.environ["AZURE_REDIS_PORT"] = str(redis_port)
        if redis_password is not None:
            self.redis_password = redis_password
            os.environ["AZURE_REDIS_PASSWORD"] = redis_password
        if redis_ssl is not None:
            self.redis_ssl = redis_ssl
            os.environ["AZURE_REDIS_SSL"] = str(redis_ssl).lower()
        if redis_url is not None:
            self.redis_url = redis_url
            os.environ["AZURE_REDIS_CONNECTION_STRING"] = redis_url

        self._initialized = False
        self._redis_client = None
        await self._ensure_client()


# Global singleton instance
cache_service = AzureRedisCacheService()

