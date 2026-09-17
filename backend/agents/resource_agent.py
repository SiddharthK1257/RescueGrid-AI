import uuid
from typing import List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import Incident, AgentResult, MossContextItem
from backend.services.gemini_service import gemini_service

class ResourceAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="RESOURCE", role="Emergency Asset Allocation & Logistics Specialist")

    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        context_str = "\n".join([f"- [{c.source}] {c.summary}: {c.content}" for c in relevant_context])
        
        system_instruction = (
            "You are the Resource & Logistics Agent for RescueGrid AI. "
            "Safety Boundary: Recommendations are advisory and do NOT trigger real automatic dispatch without human verification. "
            "Identify recommended emergency response apparatus (Ambulances, Rescue Engines, Water Tenders, Police Escorts), "
            "and establish staging priorities."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Severity: {incident.severity}\n"
            f"People: {incident.affectedPeople}\n"
            f"Latest Update: {latest_update or 'None'}\n"
            f"Shared Moss Context:\n{context_str}\n\n"
            "Produce a JSON object with: "
            "{\"findings\": [string], \"recommendations\": [string], \"uncertainty\": [string], \"urgencyScore\": integer 1-10}"
        )

        fallback = {
            "findings": [
                f"Incident complexity level requires multi-agency mutual aid deployment.",
                "Estimated resource shortfall in heavy extrication gear if multiple vehicles are crushed.",
                "Staging Area Alpha (Exit 42 North) provides sufficient apron for 12 tactical vehicles."
            ],
            "recommendations": [
                "Request 3 Advanced Life Support (ALS) ambulances and 1 Basic Life Support (BLS) unit.",
                "Stage 1 Heavy Rescue tender equipped with extrication hydraulic cutters.",
                "Mobilize 1 Fire Suppression pumper with 750-gallon water tank and foam capabilities.",
                "Request 2 Highway Patrol cruisers for highway corridor cordon."
            ],
            "uncertainty": [
                "Real-time availability of off-duty volunteer personnel unknown.",
                "Mutual aid response transit times subject to regional weather and traffic delay."
            ],
            "urgencyScore": 8
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
            data={"recommendedApparatus": ["Ambulance ALS x3", "Heavy Rescue x1", "Fire Engine x1", "Patrol x2"]}
        )
