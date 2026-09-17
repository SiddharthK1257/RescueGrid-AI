import uuid
from typing import List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import Incident, AgentResult, MossContextItem
from backend.services.gemini_service import gemini_service

class RescueAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="RESCUE", role="Physical Rescue & Hazard Mitigation Specialist")

    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        context_str = "\n".join([f"- [{c.source}] {c.summary}: {c.content}" for c in relevant_context])
        
        system_instruction = (
            "You are the Rescue and Hazard Mitigation Agent for RescueGrid AI. "
            "Safety Boundary: Never advise untrained civilians to enter burning vehicles or hazardous structural zones. "
            "Analyze vehicle deformation, fire and smoke indicators, hydraulic extrication requirements, "
            "and hot/warm/cold zone safety boundaries."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Description: {incident.description}\n"
            f"Hazards: {', '.join(incident.hazards)}\n"
            f"Latest Incident Update: {latest_update or 'None'}\n"
            f"Shared Moss Context:\n{context_str}\n\n"
            "Produce a JSON object with: "
            "{\"findings\": [string], \"recommendations\": [string], \"uncertainty\": [string], \"urgencyScore\": integer 1-10}"
        )

        has_fire = "fire" in (latest_update + " " + " ".join(incident.hazards)).lower()
        
        fallback = {
            "findings": [
                "Vehicle entanglement and structural cabin collapse likely requiring hydraulic cutting tools (Jaws of Life).",
                "Thermal runaway and smoke emissions indicate immediate ignition risk to surrounding fuel lines." if has_fire else "Heavy smoke emissions reported from vehicle compartment; thermal escalation possible.",
                "Structural stability of highway barrier and surrounding vehicles compromised."
            ],
            "recommendations": [
                "Deploy Heavy Rescue squad equipped with hydraulic spreaders and cutters.",
                "Charge two 1.75-inch attack hose lines with Class B foam for rapid vapor suppression." if has_fire else "Establish dry chemical and foam standby line 50 feet upwind.",
                "Enforce strict 100-foot hot zone isolation perimeter around smoking vehicle."
            ],
            "uncertainty": [
                "Presence of electric vehicle high-voltage battery packs unverified.",
                "Structural load-bearing condition of overturned vehicle unknown."
            ],
            "urgencyScore": 10 if has_fire else 8
        }

        data = await gemini_service.generate_structured(prompt, system_instruction, fallback)

        return AgentResult(
            resultId=f"RES-RSC-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident.incidentId,
            agentName=self.name,
            findings=data.get("findings", fallback["findings"]),
            recommendations=data.get("recommendations", fallback["recommendations"]),
            uncertainty=data.get("uncertainty", fallback["uncertainty"]),
            contextReferences=[c.contextId for c in relevant_context[:3]],
            status="COMPLETED",
            urgencyScore=data.get("urgencyScore", 8),
            data={"extricationRequired": True, "hotZoneRadiusMeters": 35}
        )
