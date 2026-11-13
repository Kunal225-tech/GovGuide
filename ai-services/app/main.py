import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.config import get_settings
from app.core.vector_store import vector_store
from app.api.v1 import v1_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("govguide-ai")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding-window per-IP rate limiter for quota-sensitive AI endpoints."""

    def __init__(self, app, window_seconds: float = 60.0, max_requests: int = 20):
        super().__init__(app)
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.requests_per_ip: Dict[str, List[float]] = defaultdict(list)
        self.protected_paths = {
            "/api/v1/chat",
            "/api/v1/profile/extract",
        }

    async def dispatch(self, request: Request, call_next):
        # Allow OPTIONS preflight without rate limit consumption
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path.rstrip("/") if request.url.path != "/" else "/"

        if path in self.protected_paths:
            # Resolve client IP (supporting reverse proxies like Render / Railway / Nginx)
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                client_ip = forwarded_for.split(",")[0].strip()
            elif request.client:
                client_ip = request.client.host
            else:
                client_ip = "unknown"

            now = time.time()
            cutoff = now - self.window_seconds
            timestamps = self.requests_per_ip[client_ip]

            # Retain only timestamps within the active sliding window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= self.max_requests:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                logger.warning(
                    f"Rate limit exceeded for client {client_ip} on {path} "
                    f"({len(valid_timestamps)}/{self.max_requests} reqs in {int(self.window_seconds)}s)"
                )
                return JSONResponse(
                    status_code=429,
                    headers={"Retry-After": str(retry_after)},
                    content={
                        "detail": (
                            f"Too Many Requests: Rate limit of {self.max_requests} requests "
                            f"per minute exceeded. Please try again in {retry_after} seconds."
                        ),
                        "retry_after_seconds": retry_after,
                    },
                )

            valid_timestamps.append(now)
            self.requests_per_ip[client_ip] = valid_timestamps

            # Memory management: purge stale IP keys periodically
            if len(self.requests_per_ip) > 2000:
                inactive = [
                    ip for ip, ts in self.requests_per_ip.items()
                    if not ts or ts[-1] <= cutoff
                ]
                for ip in inactive:
                    del self.requests_per_ip[ip]

        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    settings = get_settings()
    logger.info("=" * 60)
    logger.info(f"Starting GovGuide AI Services on {settings.HOST}:{settings.PORT}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"LLM Model: {settings.GEMINI_MODEL}")
    logger.info(f"Vector Collection: {settings.QDRANT_COLLECTION}")
    logger.info("=" * 60)

    # Initialize Qdrant collection on startup
    try:
        vector_store.ensure_collection(recreate=False)
        logger.info("Vector database verified successfully.")
    except Exception as e:
        logger.warning(f"Vector database initialization warning: {e}")

    yield

    logger.info("GovGuide AI Services shutting down.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="GovGuide AI Services API",
        description=(
            "AI-powered citizen welfare scheme assistant, retrieval-augmented "
            "generation (RAG) engine, and demographic profile extractor for GovGuide."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # In-memory per-IP rate limiting middleware for Gemini AI endpoints
    app.add_middleware(
        RateLimitMiddleware,
        window_seconds=60.0,
        max_requests=20,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers
    app.include_router(v1_router, prefix="/api")

    # Health check endpoints
    @app.get("/", tags=["Health"])
    async def root():
        return {
            "service": "GovGuide AI Services",
            "status": "operational",
            "version": "1.0.0",
            "docs": "/docs",
        }

    @app.get("/health", tags=["Health"])
    async def health():
        settings = get_settings()
        return {
            "status": "healthy",
            "gemini_configured": bool(settings.GEMINI_API_KEY),
            "collection": settings.QDRANT_COLLECTION,
            "environment": settings.ENVIRONMENT,
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True if settings.ENVIRONMENT == "development" else False,
    )

