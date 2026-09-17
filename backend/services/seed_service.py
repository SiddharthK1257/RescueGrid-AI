import logging
import uuid
import bcrypt
from datetime import datetime
from backend.models.schemas import (
    Incident, MossContextItem, AgentResult, ResponsePlan, ResponseAction, MapMarker, AuditLog, UserAccount
)
from backend.services.db_service import db_service
from backend.services.moss_service import moss_service
from backend.api.auth import DEMO_USERS

logger = logging.getLogger("rescuegrid.seeder")

REAL_INCIDENTS = [
    {
        "incidentId": "RG-2026-0001",
        "type": "TRAFFIC_COLLISION",
        "title": "Interstate 95 Multi-Vehicle Pileup",
        "location": "I-95 Northbound at Mile Marker 142",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "locationSource": "SIMULATED",
        "description": "Three vehicles have collided on a highway. Six people are reportedly involved. Two people may have serious injuries. One vehicle is smoking, and the highway is partially blocked.",
        "severity": "CRITICAL",
        "affectedPeople": 6,
        "hazards": ["SMOKING_VEHICLE", "PARTIAL_ROAD_BLOCKAGE", "TRAPPED_OCCUPANTS"],
        "status": "ACTIVE"
    },
    {
        "incidentId": "RG-2026-0002",
        "type": "HAZMAT",
        "title": "Metro Industrial Chemical Vapor Leak",
        "location": "Bayview Industrial Park, Tank Battery 4",
        "latitude": 37.7612,
        "longitude": -122.4012,
        "locationSource": "FIELD_RESPONDER",
        "description": "Anhydrous ammonia pressurized line rupture. Dense toxic vapor plume drifting north-northeast towards commercial district. 12 facility workers self-evacuating.",
        "severity": "CRITICAL",
        "affectedPeople": 12,
        "hazards": ["TOXIC_AMMONIA_PLUME", "PRESSURIZED_VESSEL_RISK", "CIVILIAN_EXPOSURE"],
        "status": "ACTIVE"
    },
    {
        "incidentId": "RG-2026-0003",
        "type": "FIRE",
        "title": "4th-Alarm Downtown Commercial High-Rise Fire",
        "location": "580 Market Street (Floor 14-16)",
        "latitude": 37.7891,
        "longitude": -122.4014,
        "locationSource": "USER_REPORTED",
        "description": "Active structure fire on 14th floor of mixed commercial high-rise. Heavy smoke showing on north face. Fire alarm activated; approximately 25 occupants sheltering in place on upper floors.",
        "severity": "HIGH",
        "affectedPeople": 25,
        "hazards": ["FLASHOVER_POTENTIAL", "UPWARD_SMOKE_PROPAGATION", "TRAPPED_OCCUPANTS_FLOOR_16"],
        "status": "ACTIVE"
    },
    {
        "incidentId": "RG-2026-0004",
        "type": "FLOOD",
        "title": "River Valley Flash Flood & Vehicle Submersion",
        "location": "River Valley Crossing at Lower Mill Road",
        "latitude": 37.7925,
        "longitude": -122.4285,
        "locationSource": "GPS_LIVE",
        "description": "Rapidly rising creek waters swept passenger SUV into retention basin. Vehicle partially submerged in fast-flowing water with 3 occupants on vehicle roof.",
        "severity": "CRITICAL",
        "affectedPeople": 3,
        "hazards": ["SWIFT_WATER_CURRENT", "HYPOTHERMIA_RISK", "UNSTABLE_VEHICLE_POSITION"],
        "status": "ACTIVE"
    }
]

async def seed_database():
    """Ensure database has real emergency incidents, demo users, plans, and map markers."""
    logger.info("[Seeder] Verifying and seeding real MongoDB collections...")

    # 1. Seed Demo Personnel Users
    for u in DEMO_USERS:
        existing = await db_service.get_user_by_email(u["email"])
        if not existing:
            salt = bcrypt.gensalt()
            pwd_hash = bcrypt.hashpw(u["password"].encode("utf-8"), salt).decode("utf-8")
            user_acc = UserAccount(
                userId=u["userId"],
                name=u["name"],
                email=u["email"],
                passwordHash=pwd_hash,
                role=u["role"],
                department=u["department"],
                badgeNumber=u["badgeNumber"]
            )
            await db_service.save_user(user_acc)
            logger.info(f"[Seeder] Seeded real operational account: {u['email']} ({u['role']})")

    # 2. Seed Real Incidents if empty
    existing_incidents = await db_service.get_incidents()
    existing_ids = {i.incidentId for i in existing_incidents}

    for inc_data in REAL_INCIDENTS:
        if inc_data["incidentId"] not in existing_ids:
            inc = Incident(**inc_data)
            await db_service.save_incident(inc)
            logger.info(f"[Seeder] Created incident record: {inc.incidentId} - {inc.title}")

            # Moss Context
            await moss_service.add_context(
                incident_id=inc.incidentId,
                source=inc.locationSource,
                context_type="INITIAL_REPORT",
                content=inc.description,
                summary=f"Initial 911 Report: {inc.title}",
                contributing_agent="SIMULATION_ENGINE",
                verification_status="VERIFIED",
                tags=[inc.type.lower(), "critical", "incident-init"],
                confidence=1.0
            )

            # Map Markers
            # Epicenter
            await db_service.save_marker(MapMarker(
                markerId=f"MK-{inc.incidentId}-01",
                incidentId=inc.incidentId,
                title=inc.title,
                type="INCIDENT",
                latitude=inc.latitude,
                longitude=inc.longitude,
                severity=inc.severity,
                status="ACTIVE",
                description=inc.description
            ))

            # Staging Area Alpha
            await db_service.save_marker(MapMarker(
                markerId=f"MK-{inc.incidentId}-02",
                incidentId=inc.incidentId,
                title="Staging Area Alpha",
                type="STAGING_AREA",
                latitude=inc.latitude - 0.003,
                longitude=inc.longitude - 0.004,
                severity="LOW",
                status="ACTIVE",
                description="Primary mutual aid staging and apparatus check-in point."
            ))

            # Triage Post
            await db_service.save_marker(MapMarker(
                markerId=f"MK-{inc.incidentId}-03",
                incidentId=inc.incidentId,
                title="Forward Medical Triage Post",
                type="MEDICAL_UNIT",
                latitude=inc.latitude + 0.002,
                longitude=inc.longitude + 0.003,
                severity="MEDIUM",
                status="ACTIVE",
                description="START triage and rapid ALS stabilization zone."
            ))

            # Response Plan v1
            plan = ResponsePlan(
                planId=f"PLAN-{inc.incidentId}-v1",
                incidentId=inc.incidentId,
                version=1,
                primaryObjective=f"Corridor containment, casualty triage, and rapid mitigation for {inc.title}.",
                rationale="Initial Plan v1 synthesized from concurrent multi-agent domain assessment.",
                uncertainties=[
                    "Exact non-ambulatory casualty count pending inner perimeter survey.",
                    "Live traffic tailback queue length upstream."
                ],
                actions=[
                    ResponseAction(
                        id=f"ACT-{inc.incidentId}-1",
                        title="Deploy Primary Tactical Sector Units",
                        agent="RESCUE",
                        priority="CRITICAL",
                        description=f"Establish hot and warm safety perimeters around {inc.location}.",
                        estimatedTime="3 - 5 min",
                        requiresApproval=True,
                        approved=False
                    ),
                    ResponseAction(
                        id=f"ACT-{inc.incidentId}-2",
                        title="Establish Advanced Life Support Triage Station",
                        agent="MEDICAL",
                        priority="HIGH",
                        description="Deploy triage collection point and prepare transport ambulances.",
                        estimatedTime="4 min",
                        requiresApproval=True,
                        approved=False
                    ),
                    ResponseAction(
                        id=f"ACT-{inc.incidentId}-3",
                        title="Perimeter Access Corridor & Diversion",
                        agent="TRAFFIC",
                        priority="HIGH",
                        description="Implement emergency corridor ingress and divert non-essential traffic.",
                        estimatedTime="3 min",
                        requiresApproval=True,
                        approved=False
                    )
                ],
                createdBy="COMMANDER_AGENT",
                status="PROPOSED"
            )
            await db_service.save_plan(plan)

            # Audit Log
            await db_service.save_audit_log(AuditLog(
                logId=f"LOG-{inc.incidentId}-INIT",
                incidentId=inc.incidentId,
                actor="SYSTEM:ORCHESTRATOR",
                action="INCIDENT_INITIALIZED",
                summary=f"Incident {inc.incidentId} ingested with Plan v1 and tactical coordinates."
            ))

    logger.info(f"[Seeder] Database ready with {len(REAL_INCIDENTS)} operational incidents and active personnel accounts.")
