from abc import ABC, abstractmethod
from typing import Dict, Any, List
from backend.models.schemas import Incident, AgentResult, MossContextItem

class BaseAgent(ABC):
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    @abstractmethod
    async def assess(
        self,
        incident: Incident,
        relevant_context: List[MossContextItem],
        latest_update: str = ""
    ) -> AgentResult:
        """Perform agent assessment and return structured result."""
        pass
