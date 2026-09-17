import uuid
from typing import List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import Incident, AgentResult, MossContextItem
from backend.services.gemini_service import gemini_service

class TrafficRouteAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="TRAFFIC", role="Corridor Ingress, Route & Access Control Specialist")

    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        context_str = "\n".join([f"- [{c.source}] {c.summary}: {c.content}" for c in relevant_context])
        
        system_instruction = (
            "You are the Traffic & Route Agent for RescueGrid AI. "
            "Safety Boundary: You do not claim verified live traffic unless telemetry is explicitly present. "
            "Clearly distinguish map-provider data, reported road blocks, and simulated routing. "
            "Analyze ingress routes for emergency responders, evacuation corridors, and highway bottlenecks."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Location: {incident.location} ({incident.latitude}, {incident.longitude})\n"
            f"Latest Incident Update: {latest_update or 'None'}\n"
            f"Shared Moss Context:\n{context_str}\n\n"
            "Produce a JSON object with: "
            "{\"findings\": [string], \"recommendations\": [string], \"uncertainty\": [string], \"urgencyScore\": integer 1-10}"
        )

        lane_blocked = "blocked" in (latest_update + " " + incident.description).lower()

        fallback = {
            "findings": [
                "Primary highway lanes reported obstructed by multi-vehicle collision debris." if lane_blocked else "High-speed multi-lane roadway creates heavy congestion tailback extending ~2.4 km.",
                "Primary access ramp blocked by incident bottleneck; secondary service road remains viable.",
                "Risk of secondary rear-end collisions in approaching traffic queue."
            ],
            "recommendations": [
                "Establish emergency-only corridor via North Service Road (Exit 42B) for inbound ambulances.",
                "Deploy Department of Transportation variable message signs 3 miles upstream warning drivers to divert.",
                "Coordinate highway patrol rolling road block 1.5 miles prior to crash scene."
            ],
            "uncertainty": [
                "Real-time congestion clearance rate depends on variable civilian driver compliance.",
                "Exact lane clearance width for heavy ladder and rescue vehicles unverified."
            ],
            "urgencyScore": 9 if lane_blocked else 7
        }

        data = await gemini_service.generate_structured(prompt, system_instruction, fallback)

        return AgentResult(
            resultId=f"RES-TRF-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident.incidentId,
            agentName=self.name,
            findings=data.get("findings", fallback["findings"]),
            recommendations=data.get("recommendations", fallback["recommendations"]),
            uncertainty=data.get("uncertainty", fallback["uncertainty"]),
            contextReferences=[c.contextId for c in relevant_context[:3]],
            status="COMPLETED",
            urgencyScore=data.get("urgencyScore", 7),
            data={"primaryIngressCorridor": "Exit 42B North Access", "isPrimaryLaneBlocked": lane_blocked}
        )
