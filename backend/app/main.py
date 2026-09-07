import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.seed import init_db
from app.api.router import api_router
from app.api.websocket import ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dubforge.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DubForge Studio DB & Seeding initial data...")
    await init_db()
    yield
    logger.info("Shutting down DubForge Studio backend...")

app = FastAPI(
    title="DubForge Studio API",
    version="1.0.0",
    description="Orchestrator backend for AI movie dubbing & subtitle pipeline",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "DubForge Studio"}
