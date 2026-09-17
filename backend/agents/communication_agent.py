import uuid
from typing import List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import Incident, AgentResult, MossContextItem
from backend.services.gemini_service import gemini_service

class CommunicationAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="COMMUNICATION", role="Public Safety PIO & Command Briefing Specialist")

    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        context_str = "\n".join([f"- [{c.source}] {c.summary}: {c.content}" for c in relevant_context])
        
        system_instruction = (
            "You are the Communication and PIO (Public Information Officer) Agent for RescueGrid AI. "
            "Draft clear, objective incident briefings, media releases, and responder notifications. "
            "Ensure terminology adheres to NIMS/ICS standards."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Description: {incident.description}\n"
            f"Severity: {incident.severity}\n"
            f"Latest Update: {latest_update or 'None'}\n"
            f"Shared Moss Context:\n{context_str}\n\n"
            "Produce a JSON object with: "
            "{\"findings\": [string], \"recommendations\": [string], \"uncertainty\": [string], \"urgencyScore\": integer 1-10, \"sitrep\": string}"
        )

        fallback = {
            "findings": [
                "Incident classified as Multi-Agency Level 2 Highway Critical Incident.",
                "Public inquiry volume anticipated due to major arterial highway closure.",
                "Inter-agency radio interoperability required between EMS and Fire frequencies."
            ],
            "recommendations": [
                "Transmit ICS-201 Incident Briefing to regional dispatch and hospital trauma centers.",
                "Issue public emergency broadcast warning drivers to avoid Highway corridor for 4 hours.",
                "Designate Media Staging Area 500m West of Exit 42 to prevent interference with emergency vehicles."
            ],
            "uncertainty": [
                "Exact victim identities withheld pending family notification and triage confirmation."
            ],
            "urgencyScore": 7,
            "sitrep": f"SITREP 01: Critical highway collision at {incident.location}. {incident.affectedPeople} casualties reported. Multi-agency response underway. Civilian detour in effect."
        }

        data = await gemini_service.generate_structured(prompt, system_instruction, fallback)

        return AgentResult(
            resultId=f"RES-COM-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident.incidentId,
            agentName=self.name,
            findings=data.get("findings", fallback["findings"]),
            recommendations=data.get("recommendations", fallback["recommendations"]),
            uncertainty=data.get("uncertainty", fallback["uncertainty"]),
            contextReferences=[c.contextId for c in relevant_context[:3]],
            status="COMPLETED",
            urgencyScore=data.get("urgencyScore", 7),
            data={"sitrep": data.get("sitrep", fallback["sitrep"])}
        )
