import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from backend.models.schemas import (
    Incident, IncidentUpdate, ResponsePlan, AgentResult, MossContextItem,
    AuditLog, MapMarker, LocationRecord, LiveKitTokenRequest, LiveKitTokenResponse,
    UpdateInjectRequest, PlanApprovalRequest, ReassessRequest
)
from backend.services.db_service import db_service
from backend.services.moss_service import moss_service
from backend.services.livekit_service import livekit_service
from backend.services.location_service import location_service
from backend.services.audit_service import audit_service
from backend.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.post("", response_model=Incident)
async def create_incident(incident: Incident, background_tasks: BackgroundTasks):
    """Create a new emergency incident, initialize Moss shared context, and trigger agent analysis."""
    if not incident.incidentId:
        incident.incidentId = f"RG-2026-{uuid.uuid4().hex[:4].upper()}"
    
    if not location_service.validate_coordinates(incident.latitude, incident.longitude):
        raise HTTPException(status_code=400, detail="Invalid latitude/longitude coordinates.")

    saved = await db_service.save_incident(incident)

    # Initial context in Moss
    await moss_service.add_context(
        incident_id=incident.incidentId,
        source="USER_REPORTED",
        context_type="INITIAL_REPORT",
        content=incident.description,
        summary=f"Initial Dispatch Report: {incident.title or incident.type} at {incident.location}",
        contributing_agent="HUMAN_DISPATCH",
        verification_status="UNVERIFIED",
        tags=["initial-report", incident.type.lower(), incident.severity.lower()],
        confidence=1.0
    )

    # Log in audit trail
    await audit_service.log_action(
        incident_id=incident.incidentId,
        actor="HUMAN:OPERATOR",
        action="INCIDENT_CREATED",
        summary=f"Emergency incident {incident.incidentId} declared: {incident.title or incident.type}"
    )

    # Run initial multi-agent collaborative cycle in background
    background_tasks.add_task(
        orchestrator.run_pipeline,
        incident.incidentId,
        "Initial dispatch assessment",
        incident.description
    )

    return saved

@router.get("", response_model=List[Incident])
async def list_incidents():
    return await db_service.get_incidents()

@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    inc = await db_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return inc

@router.patch("/{incident_id}", response_model=Incident)
async def update_incident_details(incident_id: str, updates: Dict[str, Any]):
    inc = await db_service.update_incident(incident_id, updates)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    await audit_service.log_action(
        incident_id=incident_id,
        actor="HUMAN:OPERATOR",
        action="INCIDENT_UPDATED",
        summary=f"Incident attributes updated: {', '.join(updates.keys())}"
    )
    return inc

@router.post("/{incident_id}/updates", response_model=IncidentUpdate)
async def add_incident_update(incident_id: str, payload: UpdateInjectRequest, background_tasks: BackgroundTasks):
    """Add a new incident update, store in Moss, and automatically trigger specialized agents to reassess."""
    inc = await db_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    update = IncidentUpdate(
        updateId=f"UPD-{uuid.uuid4().hex[:8].upper()}",
        incidentId=incident_id,
        source=payload.source,
        content=payload.content,
        verificationStatus=payload.verificationStatus
    )
    await db_service.save_update(update)

    # Sync into Moss Shared Context
    await moss_service.add_context(
        incident_id=incident_id,
        source=payload.source,
        context_type="INCIDENT_UPDATE",
        content=payload.content,
        summary=f"Incident Update: {payload.content[:75]}...",
        contributing_agent="HUMAN_OPERATOR",
        verification_status=payload.verificationStatus,
        tags=["incident-update", "reassessment-trigger"],
        confidence=1.0 if payload.verificationStatus == "VERIFIED" else 0.8
    )

    await audit_service.log_action(
        incident_id=incident_id,
        actor="HUMAN:OPERATOR",
        action="UPDATE_INJECTED",
        summary=f"Field update received: {payload.content}"
    )

    # Reassessment pipeline
    background_tasks.add_task(
        orchestrator.run_pipeline,
        incident_id,
        f"Dynamic Reassessment triggered by update: {payload.content[:40]}...",
        payload.content
    )

    return update

@router.post("/{incident_id}/analyze")
async def trigger_analysis(incident_id: str):
    """Manually trigger or rerun the multi-agent analysis."""
    result = await orchestrator.run_pipeline(incident_id, "Manual Operator Analysis Request")
    return result

@router.post("/{incident_id}/reassess")
async def trigger_reassessment(incident_id: str, req: ReassessRequest):
    """Explicitly command all agents and Commander to reassess with current Moss shared context."""
    result = await orchestrator.run_pipeline(incident_id, req.reason)
    return result

@router.get("/{incident_id}/agents", response_model=List[AgentResult])
async def get_agent_results(incident_id: str):
    return await db_service.get_agent_results(incident_id)

@router.get("/{incident_id}/context", response_model=List[MossContextItem])
async def get_moss_context(incident_id: str):
    return await moss_service.get_context(incident_id)

@router.get("/{incident_id}/timeline", response_model=List[AuditLog])
async def get_incident_timeline(incident_id: str):
    return await audit_service.get_timeline(incident_id)

@router.get("/{incident_id}/response-plan")
async def get_response_plan(incident_id: str):
    latest = await db_service.get_latest_plan(incident_id)
    all_plans = await db_service.get_plans(incident_id)
    return {
        "latestPlan": latest,
        "history": all_plans
    }

@router.post("/{incident_id}/approve", response_model=ResponsePlan)
async def approve_response_plan(incident_id: str, req: PlanApprovalRequest):
    """Human approval of the Commander's proposed response plan."""
    plan = await db_service.get_latest_plan(incident_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No active response plan found.")

    plan.status = "APPROVED" if req.approved else "REJECTED"
    plan.approvedBy = req.operatorId
    plan.approvalNotes = req.notes
    await db_service.save_plan(plan)

    action_type = "PLAN_APPROVED" if req.approved else "PLAN_REJECTED"
    summary = f"Operator {req.operatorId} {action_type.lower().replace('_', ' ')} for Plan v{plan.version}"
    if req.notes:
        summary += f" (Notes: {req.notes})"

    await audit_service.log_action(
        incident_id=incident_id,
        actor=f"HUMAN:{req.operatorId}",
        action=action_type,
        summary=summary,
        metadata={"version": plan.version, "approved": req.approved}
    )

    # Sync approval into Moss
    await moss_service.add_context(
        incident_id=incident_id,
        source="HUMAN_VERIFIED",
        context_type="OPERATOR_NOTE",
        content=summary,
        summary=f"Plan v{plan.version} {plan.status} by {req.operatorId}",
        contributing_agent="HUMAN_OPERATOR",
        verification_status="VERIFIED",
        tags=["plan-approval", f"v{plan.version}"],
        version=plan.version
    )

    return plan

@router.post("/{incident_id}/reject", response_model=ResponsePlan)
async def reject_response_plan(incident_id: str, req: PlanApprovalRequest):
    req.approved = False
    return await approve_response_plan(incident_id, req)

@router.post("/{incident_id}/livekit-token", response_model=LiveKitTokenResponse)
async def generate_livekit_token(incident_id: str, req: LiveKitTokenRequest):
    """Generate secure LiveKit room JWT token for real-time collaboration."""
    room_name = f"incident-{incident_id.lower()}"
    return livekit_service.generate_token(
        room_name=room_name,
        participant_name=req.participantName,
        participant_identity=req.participantIdentity,
        is_admin=True
    )

@router.get("/{incident_id}/collaboration-status")
async def get_collaboration_status(incident_id: str):
    room_name = f"incident-{incident_id.lower()}"
    return livekit_service.get_room_status(room_name)

@router.post("/{incident_id}/location", response_model=LocationRecord)
async def record_user_location(incident_id: str, loc: LocationRecord):
    """Record browser geolocation after user grants explicit permission."""
    if not location_service.validate_coordinates(loc.latitude, loc.longitude):
        raise HTTPException(status_code=400, detail="Invalid coordinates.")
    
    saved = await db_service.save_location(loc)
    
    # Also add as a map marker
    marker = MapMarker(
        markerId=f"MK-USER-{uuid.uuid4().hex[:6].upper()}",
        incidentId=incident_id,
        title="Operator / User Live Location",
        type="USER_LOCATION",
        latitude=loc.latitude,
        longitude=loc.longitude,
        severity="LOW",
        status="ACTIVE",
        description=f"Browser GPS telemetry (Accuracy: {loc.accuracy or 'unknown'}m)",
        isSimulated=loc.isSimulated,
        verificationStatus="VERIFIED"
    )
    await db_service.save_marker(marker)

    await audit_service.log_action(
        incident_id=incident_id,
        actor="HUMAN:OPERATOR",
        action="LOCATION_RECORDED",
        summary=f"Operator live location marker added ({loc.latitude:.4f}, {loc.longitude:.4f})"
    )

    return saved

@router.get("/{incident_id}/map-data")
async def get_map_data(incident_id: str):
    inc = await db_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    markers = await db_service.get_markers(incident_id)
    if not markers:
        # Generate initial markers
        markers = location_service.generate_incident_markers(
            incident_id=inc.incidentId,
            lat=inc.latitude,
            lon=inc.longitude,
            title=inc.title or inc.type,
            hazards=inc.hazards
        )
        for m in markers:
            await db_service.save_marker(m)

    locations = await db_service.get_locations(incident_id)
    return {
        "incident": inc,
        "markers": markers,
        "locations": locations
    }

@router.post("/{incident_id}/map-markers", response_model=MapMarker)
async def add_custom_map_marker(incident_id: str, marker: MapMarker):
    if not location_service.validate_coordinates(marker.latitude, marker.longitude):
        raise HTTPException(status_code=400, detail="Invalid coordinates.")
    return await db_service.save_marker(marker)
