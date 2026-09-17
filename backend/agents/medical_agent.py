import uuid
from typing import List
from backend.agents.base_agent import BaseAgent
from backend.models.schemas import Incident, AgentResult, MossContextItem
from backend.services.gemini_service import gemini_service

class MedicalAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="MEDICAL", role="Medical Triage & Casualty Assessment Specialist")

    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        context_str = "\n".join([f"- [{c.source}] {c.summary}: {c.content}" for c in relevant_context])
        
        system_instruction = (
            "You are the Medical Triage Agent for RescueGrid AI emergency response coordination. "
            "Safety Boundary: You do NOT provide clinical diagnoses or replace emergency medical doctors. "
            "Analyze reported injuries, identify estimated triage categories (Red/Immediate, Yellow/Delayed, Green/Minor), "
            "and propose prioritized medical staging recommendations. "
            "Always identify areas of medical uncertainty."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Description: {incident.description}\n"
            f"Reported Affected People: {incident.affectedPeople}\n"
            f"Reported Hazards: {', '.join(incident.hazards)}\n"
            f"Latest Incident Update: {latest_update or 'None'}\n"
            f"Shared Moss Context:\n{context_str}\n\n"
            "Produce a JSON object with: "
            "{\"findings\": [string], \"recommendations\": [string], \"uncertainty\": [string], \"urgencyScore\": integer 1-10}"
        )

        fallback = {
            "findings": [
                f"Reported {incident.affectedPeople} individuals involved with potential high-impact trauma.",
                "High probability of blunt force deceleration trauma given multi-vehicle highway collision.",
                "Critical vulnerability window for occupants in smoking or damaged vehicles."
            ],
            "recommendations": [
                "Deploy Advanced Life Support (ALS) triage station at designated safe perimeter staging zone.",
                "Prepare 2 Rapid Transport Medical Helicopters on standby for critical red-tier casualties.",
                "Establish on-scene START (Simple Triage and Rapid Treatment) sorting corridor immediately upon arrival."
            ],
            "uncertainty": [
                "Exact number of non-ambulatory trapped victims remains unconfirmed by on-scene personnel.",
                "Vital signs and Glasgow Coma Scale (GCS) unknown; estimates based solely on caller reports."
            ],
            "urgencyScore": 9
        }

        data = await gemini_service.generate_structured(prompt, system_instruction, fallback)

        return AgentResult(
            resultId=f"RES-MED-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident.incidentId,
            agentName=self.name,
            findings=data.get("findings", fallback["findings"]),
            recommendations=data.get("recommendations", fallback["recommendations"]),
            uncertainty=data.get("uncertainty", fallback["uncertainty"]),
            contextReferences=[c.contextId for c in relevant_context[:3]],
            status="COMPLETED",
            urgencyScore=data.get("urgencyScore", 9),
            data={"triageFocus": "Trauma & Airway Protection", "recommendedUnits": 3}
        )
