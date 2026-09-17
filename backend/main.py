import logging
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
    
    # Connect DB
    await db_service.connect()
    
    # Initialize Moss
    await moss_service.initialize()

    # Seed Real Database Collections & Personnel Accounts
    await seed_database()

    yield
    logger.info("Shutting down RescueGrid AI services.")

app = FastAPI(
    title="RescueGrid AI Emergency Response API",
    description="Multi-Agent Emergency Response & Collaborative Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(incidents_router)
app.include_router(simulation_router)
app.include_router(health_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=config.HOST, port=config.PORT, reload=True)
