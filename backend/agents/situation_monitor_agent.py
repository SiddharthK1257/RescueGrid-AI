import uuid
from typing import List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import Incident, AgentResult, MossContextItem
from backend.services.gemini_service import gemini_service

class SituationMonitorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="MONITOR", role="Dynamic Situation & Escalation Monitor")

    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        context_str = "\n".join([f"- [{c.source}] {c.summary}: {c.content}" for c in relevant_context])
        
        system_instruction = (
            "You are the Situation Monitor Agent for RescueGrid AI. "
            "Track environmental drift, timeline escalations, compound hazards, and inconsistencies between reports. "
            "Flag triggers that demand Commander reassessment or immediate tactical pivots."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Hazards: {', '.join(incident.hazards)}\n"
            f"Latest Incident Update: {latest_update or 'None'}\n"
            f"Shared Moss Context:\n{context_str}\n\n"
            "Produce a JSON object with: "
            "{\"findings\": [string], \"recommendations\": [string], \"uncertainty\": [string], \"urgencyScore\": integer 1-10, \"escalationTriggered\": boolean}"
        )

        has_escalation = bool(latest_update) or any("fire" in h.lower() for h in incident.hazards)

        fallback = {
            "findings": [
                "Incident trajectory shifting from initial stabilization to active multi-threat containment." if has_escalation else "Incident parameters currently within baseline bounds of initial collision report.",
                "Weather conditions indicate 12 mph crosswinds, potentially affecting smoke dispersal.",
                "Compounding hazard detected: thermal heat signature adjacent to gasoline fuel tank." if has_escalation else "Traffic tailback rate currently exceeding standard clearance estimates."
            ],
            "recommendations": [
                "Trigger immediate tactical reassessment across all specialized agents." if has_escalation else "Maintain continuous 3-minute telemetry polling cycle.",
                "Expand safety cordon from 50m to 150m immediately.",
                "Alert regional burn unit and trauma center to prepare for potential surge."
            ],
            "uncertainty": [
                "Rate of fire spread and potential hazardous materials in secondary vehicle trunk unverified."
            ],
            "urgencyScore": 10 if has_escalation else 6,
            "escalationTriggered": has_escalation
        }

        data = await gemini_service.generate_structured(prompt, system_instruction, fallback)

        return AgentResult(
            resultId=f"RES-MON-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident.incidentId,
            agentName=self.name,
            findings=data.get("findings", fallback["findings"]),
            recommendations=data.get("recommendations", fallback["recommendations"]),
            uncertainty=data.get("uncertainty", fallback["uncertainty"]),
            contextReferences=[c.contextId for c in relevant_context[:3]],
            status="COMPLETED",
            urgencyScore=data.get("urgencyScore", 6),
            data={"escalationTriggered": data.get("escalationTriggered", has_escalation)}
        )
