import os
import sys
from pathlib import Path

# Ensure both repository root and backend directory are in sys.path
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parent
_repo_root = _backend_dir.parent
for _p in [str(_repo_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import config
from backend.services.db_service import db_service
from backend.services.moss_service import moss_service
from backend.services.audit_service import audit_service
from backend.api.incidents import router as incidents_router
from backend.api.simulation import router as simulation_router
from backend.api.health import router as health_router
from backend.api.auth import router as auth_router
from backend.services.seed_service import seed_database
from backend.models.schemas import Incident
from backend.agents.orchestrator import orchestrator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rescuegrid.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("===========================================================")
    logger.info("  RESCUEGRID AI — COLLABORATIVE MULTI-AGENT EMERGENCY PLATFORM")
    logger.info("===========================================================")
    
    # Connect DB (with resilient fallback)
    try:
        await db_service.connect()
    except Exception as e:
        logger.warning(f"[Startup] MongoDB connection warning: {e}. Fallback store active.")
    
    # Initialize Moss
    try:
        await moss_service.initialize()
    except Exception as e:
        logger.warning(f"[Startup] Moss initialization warning: {e}. Local demo context active.")

    # Seed Real Database Collections & Personnel Accounts
    try:
        await seed_database()
    except Exception as e:
        logger.warning(f"[Startup] Seeding database notice: {e}.")

    yield
    logger.info("Shutting down RescueGrid AI services.")

app = FastAPI(
    title="RescueGrid AI Emergency Response API",
    description="Multi-Agent Emergency Response & Collaborative Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow all origins for seamless web deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint for health check and platform info
@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "system": "RESCUEGRID AI — Multiplayer AI Emergency Response Platform",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "health": "/api/health",
            "docs": "/docs",
            "auth": "/api/auth",
            "incidents": "/api/incidents",
            "simulation": "/api/simulation"
        }
    }

# Include Routers
app.include_router(auth_router)
app.include_router(incidents_router)
app.include_router(simulation_router)
app.include_router(health_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", config.PORT))
    host = os.getenv("HOST", config.HOST)
    reload = os.getenv("ENV", "production").lower() == "development"
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload)
