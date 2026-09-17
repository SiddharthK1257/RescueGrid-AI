from fastapi import APIRouter, BackgroundTasks, HTTPException
from backend.models.schemas import Incident, UpdateInjectRequest
from backend.services.db_service import db_service
from backend.services.moss_service import moss_service
from backend.services.audit_service import audit_service
from backend.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

@router.post("/start")
async def start_flagship_simulation(background_tasks: BackgroundTasks):
    """
    Initialize the Flagship Hackathon Scenario:
    "Three vehicles have collided on a highway. Six people are reportedly involved.
     Two people may have serious injuries. One vehicle is smoking, and the highway is partially blocked."
    """
    flagship_incident = Incident(
        incidentId="RG-2026-0001",
        type="TRAFFIC_COLLISION",
        title="Interstate 95 Multi-Vehicle Pileup",
        location="I-95 Northbound at Mile Marker 142",
        latitude=37.7749,
        longitude=-122.4194,
        locationSource="SIMULATED",
        description="Three vehicles have collided on a highway. Six people are reportedly involved. Two people may have serious injuries. One vehicle is smoking, and the highway is partially blocked.",
        severity="CRITICAL",
        affectedPeople=6,
        hazards=["SMOKING_VEHICLE", "PARTIAL_ROAD_BLOCKAGE", "TRAPPED_OCCUPANTS"],
        status="ACTIVE"
    )

    await db_service.save_incident(flagship_incident)

    # Initial Moss Context
    await moss_service.add_context(
        incident_id=flagship_incident.incidentId,
        source="SIMULATED",
        context_type="INITIAL_REPORT",
        content=flagship_incident.description,
        summary="911 Emergency Dispatch: Highway 3-Car Pileup with Smoke and Critical Casualties",
        contributing_agent="SIMULATION_ENGINE",
        verification_status="SIMULATED",
        tags=["flagship-demo", "highway", "trauma", "extrication"],
        confidence=1.0
    )

    await audit_service.log_action(
        incident_id=flagship_incident.incidentId,
        actor="SYSTEM:SIMULATION",
        action="SCENARIO_LOADED",
        summary="Flagship Hackathon Scenario initialized (RG-2026-0001)"
    )

    # Run initial pipeline
    result = await orchestrator.run_pipeline(
        flagship_incident.incidentId,
        "Initial Flagship Simulation Pipeline Execution",
        flagship_incident.description
    )

    return {
        "status": "SIMULATION_INITIALIZED",
        "incidentId": flagship_incident.incidentId,
        "message": "Flagship highway scenario loaded with MOSS shared context and Response Plan v1.",
        "result": result
    }

@router.post("/{incident_id}/inject-update")
async def inject_simulation_update(
    incident_id: str,
    payload: UpdateInjectRequest,
    background_tasks: BackgroundTasks
):
    """
    Inject the Flagship Hackathon Injected Update:
    "Fire is now reported in one vehicle, and the primary access lane is blocked."
    Triggers Moss context update, concurrent agent reassessment, map update, and Plan v2 generation.
    """
    inc = await db_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Update incident hazards
    new_hazards = list(set(inc.hazards + ["ACTIVE_FIRE", "TOTAL_LANE_BLOCKAGE"]))
    await db_service.update_incident(incident_id, {"hazards": new_hazards, "severity": "CRITICAL"})

    # Store in Moss
    await moss_service.add_context(
        incident_id=incident_id,
        source="SIMULATED",
        context_type="INCIDENT_UPDATE",
        content=payload.content,
        summary=f"Injected Update: {payload.content}",
        contributing_agent="HUMAN_OPERATOR",
        verification_status="SIMULATED",
        tags=["injected-update", "fire", "blockage", "reassessment"],
        confidence=1.0
    )

    await audit_service.log_action(
        incident_id=incident_id,
        actor="HUMAN:OPERATOR",
        action="UPDATE_INJECTED_SIMULATION",
        summary=f"Simulation update injected: {payload.content}"
    )

    # Trigger replanning synchronously or return immediately
    result = await orchestrator.run_pipeline(
        incident_id,
        f"Reassessment from injected update: {payload.content}",
        payload.content
    )

    return {
        "status": "UPDATE_PROCESSED",
        "incidentId": incident_id,
        "message": "Update stored in Moss. Multi-agent reassessment executed. Plan revised.",
        "revisedPlan": result.get("responsePlan")
    }
