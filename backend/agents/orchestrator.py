import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.models.schemas import (
    Incident, AgentResult, ResponsePlan, MossContextItem
)
from backend.services.db_service import db_service
from backend.services.moss_service import moss_service
from backend.services.audit_service import audit_service
from backend.services.location_service import location_service
from backend.agents.medical_agent import MedicalAgent
from backend.agents.rescue_agent import RescueAgent
from backend.agents.traffic_route_agent import TrafficRouteAgent
from backend.agents.resource_agent import ResourceAgent
from backend.agents.communication_agent import CommunicationAgent
from backend.agents.situation_monitor_agent import SituationMonitorAgent
from backend.agents.commander_agent import commander_agent

logger = logging.getLogger("rescuegrid.orchestrator")

class AgentOrchestrator:
    def __init__(self):
        self.medical_agent = MedicalAgent()
        self.rescue_agent = RescueAgent()
        self.traffic_agent = TrafficRouteAgent()
        self.resource_agent = ResourceAgent()
        self.communication_agent = CommunicationAgent()
        self.monitor_agent = SituationMonitorAgent()
        self.commander_agent = commander_agent
        
        # In-memory agent status map
        self._agent_status: Dict[str, str] = {
            "COMMANDER": "IDLE",
            "MEDICAL": "IDLE",
            "RESCUE": "IDLE",
            "TRAFFIC": "IDLE",
            "RESOURCE": "IDLE",
            "COMMUNICATION": "IDLE",
            "MONITOR": "IDLE"
        }

    def get_agent_statuses(self) -> Dict[str, str]:
        return dict(self._agent_status)

    async def run_pipeline(
        self,
        incident_id: str,
        trigger_reason: str = "Initial incident analysis",
        latest_update: str = ""
    ) -> Dict[str, Any]:
        """
        Execute full multi-agent collaborative cycle:
        1. Fetch Incident & Moss Context
        2. Set agents to ANALYZING
        3. Concurrently run specialized agents
        4. Write agent results into Moss Shared Context
        5. Commander synthesizes versioned Response Plan
        6. Update map markers and audit log
        """
        incident = await db_service.get_incident(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        logger.info(f"[Orchestrator] Running collaborative pipeline for {incident_id}: {trigger_reason}")
        
        # Set agent status to ANALYZING
        for k in self._agent_status:
            self._agent_status[k] = "ANALYZING"

        await audit_service.log_action(
            incident_id=incident_id,
            actor="SYSTEM:ORCHESTRATOR",
            action="PIPELINE_STARTED",
            summary=f"Multi-agent collaborative cycle triggered: {trigger_reason}"
        )

        # Retrieve relevant context slices from Moss for specialized agents
        med_ctx = await moss_service.retrieve_relevant_context(incident_id, "triage casualty medical trauma", "MEDICAL")
        rsc_ctx = await moss_service.retrieve_relevant_context(incident_id, "extrication fire smoke collapse", "RESCUE")
        trf_ctx = await moss_service.retrieve_relevant_context(incident_id, "route highway access blockage road", "TRAFFIC")
        res_ctx = await moss_service.retrieve_relevant_context(incident_id, "apparatus ambulance fire truck resource", "RESOURCE")
        com_ctx = await moss_service.retrieve_relevant_context(incident_id, "briefing sitrep public notification", "COMMUNICATION")
        mon_ctx = await moss_service.retrieve_relevant_context(incident_id, "threat escalation environmental hazard", "MONITOR")

        # Run specialized agents concurrently with error isolation
        async def safe_assess(agent, ctx):
            try:
                res = await agent.assess(incident, ctx, latest_update)
                self._agent_status[agent.name] = "COMPLETED"
                return res
            except Exception as e:
                logger.error(f"[Orchestrator] Agent {agent.name} failed: {e}")
                self._agent_status[agent.name] = "UNAVAILABLE"
                return AgentResult(
                    resultId=f"RES-{agent.name}-ERR",
                    incidentId=incident_id,
                    agentName=agent.name,
                    findings=[f"Agent encountered temporary processing limitation: {str(e)}"],
                    recommendations=["Human operator manual review required for this domain."],
                    uncertainty=["Autonomous reasoning interrupted."],
                    status="UNAVAILABLE"
                )

        results = await asyncio.gather(
            safe_assess(self.medical_agent, med_ctx),
            safe_assess(self.rescue_agent, rsc_ctx),
            safe_assess(self.traffic_agent, trf_ctx),
            safe_assess(self.resource_agent, res_ctx),
            safe_assess(self.communication_agent, com_ctx),
            safe_assess(self.monitor_agent, mon_ctx)
        )

        # Save all results to database and sync back into Moss Shared Context
        for res in results:
            await db_service.save_agent_result(res)
            # Sync key recommendation into Moss
            summary_text = f"{res.agentName}: " + (res.recommendations[0] if res.recommendations else "Analysis completed.")
            await moss_service.add_context(
                incident_id=incident_id,
                source="AI_GENERATED",
                context_type="AGENT_ASSESSMENT",
                content="; ".join(res.findings + res.recommendations),
                summary=summary_text,
                contributing_agent=res.agentName,
                verification_status="UNVERIFIED",
                tags=[res.agentName.lower(), "ai-assessment"],
                confidence=0.9
            )

        # Commander synthesizes response plan
        previous_plan = await db_service.get_latest_plan(incident_id)
        response_plan = await self.commander_agent.synthesize_plan(
            incident=incident,
            agent_results=results,
            previous_plan=previous_plan,
            trigger_reason=trigger_reason
        )
        self._agent_status["COMMANDER"] = "COMPLETED"
        await db_service.save_plan(response_plan)

        # Record Plan Snapshot in Moss
        await moss_service.add_context(
            incident_id=incident_id,
            source="AI_GENERATED",
            context_type="PLAN_SNAPSHOT",
            content=f"Plan v{response_plan.version}: {response_plan.primaryObjective}\nRationale: {response_plan.rationale}",
            summary=f"Commander Response Plan v{response_plan.version} Proposed",
            contributing_agent="COMMANDER",
            verification_status="UNVERIFIED",
            tags=["plan", f"v{response_plan.version}"],
            version=response_plan.version
        )

        # Update Map Markers
        has_fire = any("fire" in r.lower() for res in results for r in res.findings) or "fire" in latest_update.lower()
        has_block = any("block" in r.lower() for res in results for r in res.findings) or "block" in latest_update.lower()
        markers = location_service.generate_incident_markers(
            incident_id=incident.incidentId,
            lat=incident.latitude,
            lon=incident.longitude,
            title=incident.title or incident.type,
            hazards=incident.hazards + (["FIRE"] if has_fire else []),
            is_blocked=has_block
        )
        for m in markers:
            await db_service.save_marker(m)

        await audit_service.log_action(
            incident_id=incident_id,
            actor="AGENT:COMMANDER",
            action=f"PLAN_PROPOSED_v{response_plan.version}",
            summary=f"Commander formulated Response Plan v{response_plan.version}: {response_plan.primaryObjective}"
        )

        return {
            "incidentId": incident_id,
            "responsePlan": response_plan,
            "agentResults": results,
            "mapMarkers": markers,
            "agentStatuses": self.get_agent_statuses()
        }

orchestrator = AgentOrchestrator()
