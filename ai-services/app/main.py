import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.core.vector_store import vector_store
from app.api.v1 import v1_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("govguide-ai")


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

