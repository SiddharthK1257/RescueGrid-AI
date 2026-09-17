from datetime import datetime
from fastapi import APIRouter
from backend.services.db_service import db_service
from backend.services.moss_service import moss_service
from backend.services.gemini_service import gemini_service
from backend.services.livekit_service import livekit_service
from backend.services.location_service import location_service

router = APIRouter(tags=["health"])

@router.get("/api/health")
async def health_check():
    moss_status = moss_service.get_status()
    return {
        "status": "ONLINE",
        "system": "RESCUEGRID AI — Multiplayer AI Emergency Response & Coordination Platform",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "geminiAiReasoning": {
                "status": "AVAILABLE" if gemini_service.is_available else "DEMO_FALLBACK_ACTIVE",
                "mode": "GEMINI_2.5_FLASH" if gemini_service.is_available else "LOCAL_DOMAIN_EXPERT_ENGINE"
            },
            "mossSharedContext": {
                "status": "ONLINE",
                "mode": moss_status["mode"],
                "isDemoFallback": moss_status["isDemoFallback"],
                "totalContextCount": moss_status["totalContextCount"]
            },
            "livekitCollaboration": {
                "status": "ONLINE",
                "url": livekit_service.url
            },
            "mongoDbPersistence": {
                "status": "CONNECTED" if db_service.is_connected else "RESILIENT_IN_MEMORY_ACTIVE",
                "isFallback": db_service.fallback_mode
            },
            "interactiveMapService": {
                "status": "ONLINE",
                "provider": "OpenStreetMap / Leaflet Geolocation",
                "liveLocationSupported": True
            }
        },
        "safetyNotice": (
            "RESCUEGRID AI is an AI-assisted coordination prototype. "
            "AI-generated recommendations are advisory and require human review. "
            "Real emergency decisions and dispatch remain under qualified human professionals and authorized emergency services."
        )
    }
