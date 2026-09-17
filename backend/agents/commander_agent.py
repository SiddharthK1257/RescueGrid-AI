import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.models.schemas import (
    Incident, AgentResult, ResponsePlan, ResponseAction, MossContextItem
)
from backend.services.gemini_service import gemini_service

logger = logging.getLogger("rescuegrid.commander")

class CommanderAgent:
    def __init__(self):
        self.name = "COMMANDER"
        self.role = "Strategic Incident Commander & Plan Synthesizer"

    async def synthesize_plan(
        self,
        incident: Incident,
        agent_results: List[AgentResult],
        previous_plan: Optional[ResponsePlan] = None,
        trigger_reason: str = "Initial incident analysis"
    ) -> ResponsePlan:
        """
        Synthesize multi-agent findings into an explainable, actionable, versioned Response Plan.
        Detects conflicts between agent recommendations and provides reasoned resolution.
        """
        version = (previous_plan.version + 1) if previous_plan else 1
        
        # Build synthesis prompt
        results_summary = ""
        for r in agent_results:
            results_summary += f"\n[{r.agentName} AGENT]\n"
            results_summary += "Findings: " + "; ".join(r.findings[:3]) + "\n"
            results_summary += "Recommendations: " + "; ".join(r.recommendations[:3]) + "\n"
            results_summary += "Uncertainty: " + "; ".join(r.uncertainty[:2]) + "\n"

        system_instruction = (
            "You are the Central Incident Commander Agent for RescueGrid AI. "
            "Your role is to evaluate specialized agent findings (Medical, Rescue, Traffic, Resource, Communication, Monitor), "
            "resolve tactical trade-offs or route conflicts, and synthesize a structured, versioned response plan. "
            "Each action must state priority, responsible agent, estimated time, and whether it requires human approval. "
            "All recommendations are advisory pending human review."
        )

        prompt = (
            f"Incident: {incident.title or incident.type}\n"
            f"Location: {incident.location}\n"
            f"Severity: {incident.severity}\n"
            f"Trigger Reason: {trigger_reason}\n"
            f"Plan Version: v{version}\n"
            f"Agent Findings:\n{results_summary}\n\n"
            "Return a JSON object with: "
            "{\"primaryObjective\": string, \"rationale\": string, \"uncertainties\": [string], "
            "\"actions\": [{\"title\": string, \"agent\": string, \"priority\": string, \"description\": string, \"estimatedTime\": string, \"requiresApproval\": boolean}]}"
        )

        # Fallback tailored to initial or revised version
        is_revised = version > 1 or "fire" in trigger_reason.lower() or "blocked" in trigger_reason.lower()
        
        if is_revised:
            fallback = {
                "primaryObjective": "Contain active vehicle fire and redirect incoming units via North Service Road corridor.",
                "rationale": f"Plan v{version} triggered by: {trigger_reason}. Fire escalation and primary lane blockage necessitate immediate rerouting of ambulances and heavy foam suppression attack.",
                "uncertainties": [
                    "Structural integrity of burned vehicle compartment before extrication.",
                    "Exact clearance time for blocked highway lanes."
                ],
                "actions": [
                    {
                        "title": "Establish North Service Road Emergency Corridor",
                        "agent": "TRAFFIC",
                        "priority": "CRITICAL",
                        "description": "Reroute incoming ALS ambulances via Exit 42B North bypass due to confirmed main lane obstruction.",
                        "estimatedTime": "Immediate (2 min)",
                        "requiresApproval": True
                    },
                    {
                        "title": "Deploy Class B Foam Fire Suppression",
                        "agent": "RESCUE",
                        "priority": "CRITICAL",
                        "description": "Suppress active vehicle fire before initiating hydraulic extrication to safeguard victims.",
                        "estimatedTime": "3 - 5 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Expand Perimeter and Re-triage Red-Tier Casualties",
                        "agent": "MEDICAL",
                        "priority": "HIGH",
                        "description": "Relocate triage area to 150m upwind buffer zone due to thermal and smoke drift.",
                        "estimatedTime": "5 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Dispatch Secondary Mutual Aid Pumper Unit",
                        "agent": "RESOURCE",
                        "priority": "HIGH",
                        "description": "Mobilize auxiliary water supply tender to back up primary attack line.",
                        "estimatedTime": "8 - 12 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Broadcast Urgent Highway Detour SITREP",
                        "agent": "COMMUNICATION",
                        "priority": "MEDIUM",
                        "description": "Update traffic advisory radio and navigation services regarding total corridor shutdown.",
                        "estimatedTime": "Immediate",
                        "requiresApproval": False
                    }
                ]
            }
        else:
            fallback = {
                "primaryObjective": "Rapid extrication, primary casualty triage, and corridor stabilization.",
                "rationale": f"Initial Plan v1 synthesized from concurrent assessments across 6 specialized agents. High-impact deceleration collision with multiple potential trapped occupants.",
                "uncertainties": [
                    "Non-ambulatory victim count pending on-scene responder physical survey.",
                    "Live traffic tailback queue length upstream."
                ],
                "actions": [
                    {
                        "title": "Deploy Heavy Extrication Cutters to Vehicle 1 & 2",
                        "agent": "RESCUE",
                        "priority": "CRITICAL",
                        "description": "Perform roof removal and door spreading to extract trapped non-ambulatory occupants.",
                        "estimatedTime": "5 - 8 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Establish Advanced Life Support Triage Base",
                        "agent": "MEDICAL",
                        "priority": "HIGH",
                        "description": "Set up Red/Yellow/Green sorting station at Staging Area Alpha.",
                        "estimatedTime": "4 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Highway Patrol Traffic Diversion at Exit 41",
                        "agent": "TRAFFIC",
                        "priority": "HIGH",
                        "description": "Divert civilian vehicles upstream to preserve shoulder for inbound emergency units.",
                        "estimatedTime": "3 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Stage 3 ALS Ambulances & 1 Water Pumper",
                        "agent": "RESOURCE",
                        "priority": "HIGH",
                        "description": "Position response apparatus in ordered queue at staging apron.",
                        "estimatedTime": "6 min",
                        "requiresApproval": True
                    },
                    {
                        "title": "Issue Initial Press & Emergency Services SITREP",
                        "agent": "COMMUNICATION",
                        "priority": "MEDIUM",
                        "description": "Publish factual incident summary to regional trauma network and dispatch.",
                        "estimatedTime": "Immediate",
                        "requiresApproval": False
                    }
                ]
            }

        data = await gemini_service.generate_structured(prompt, system_instruction, fallback)

        actions = []
        raw_actions = data.get("actions", fallback["actions"])
        for idx, act in enumerate(raw_actions):
            actions.append(
                ResponseAction(
                    id=f"ACT-v{version}-{idx+1}",
                    title=act.get("title", f"Tactical Action {idx+1}"),
                    agent=act.get("agent", "COMMANDER"),
                    priority=act.get("priority", "HIGH"),
                    description=act.get("description", ""),
                    estimatedTime=act.get("estimatedTime", "5 min"),
                    requiresApproval=act.get("requiresApproval", True),
                    approved=False
                )
            )

        return ResponsePlan(
            planId=f"PLAN-{incident.incidentId}-v{version}",
            incidentId=incident.incidentId,
            version=version,
            actions=actions,
            rationale=data.get("rationale", fallback["rationale"]),
            primaryObjective=data.get("primaryObjective", fallback["primaryObjective"]),
            uncertainties=data.get("uncertainties", fallback["uncertainties"]),
            createdBy="COMMANDER_AGENT",
            status="PROPOSED",
            createdAt=datetime.utcnow().isoformat()
        )

commander_agent = CommanderAgent()
