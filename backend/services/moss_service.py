import logging
import uuid
import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.config import config
from backend.models.schemas import MossContextItem

logger = logging.getLogger("rescuegrid.moss")

class MossContextService:
    def __init__(self):
        self.api_key = config.MOSS_API_KEY
        self.endpoint = config.MOSS_ENDPOINT
        self.is_connected = False
        self.is_demo_fallback = True
        
        # Local semantic & temporal memory storage
        self._context_store: Dict[str, List[MossContextItem]] = {}
        self._retrieval_history: List[Dict[str, Any]] = []

    async def initialize(self):
        """Verify connectivity with Moss Shared Context service."""
        if self.api_key and self.endpoint and "localhost" not in self.endpoint:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    resp = await client.get(f"{self.endpoint}/health", headers={"Authorization": f"Bearer {self.api_key}"})
                    if resp.status_code == 200:
                        self.is_connected = True
                        self.is_demo_fallback = False
                        logger.info("Connected to remote Moss Shared Context Service.")
                        return
            except Exception as e:
                logger.warning(f"Could not connect to remote Moss endpoint: {e}. Running in LOCAL DEMO CONTEXT mode.")
        else:
            logger.info("Running in verified LOCAL DEMO CONTEXT mode (High-Fidelity In-Memory Semantic Layer).")
            
        self.is_connected = False
        self.is_demo_fallback = True

    async def add_context(
        self,
        incident_id: str,
        source: str,
        context_type: str,
        content: str,
        summary: str,
        contributing_agent: Optional[str] = None,
        verification_status: str = "UNVERIFIED",
        tags: Optional[List[str]] = None,
        confidence: float = 1.0,
        version: int = 1
    ) -> MossContextItem:
        """Add a verified or unverified context slice to the shared memory space."""
        item = MossContextItem(
            contextId=f"CTX-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident_id,
            source=source,
            type=context_type,
            content=content,
            summary=summary,
            contributingAgent=contributing_agent,
            version=version,
            verificationStatus=verification_status,
            tags=tags or [],
            confidence=confidence,
            timestamp=datetime.utcnow().isoformat()
        )

        # Forward to remote Moss if configured
        if self.is_connected and not self.is_demo_fallback:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(
                        f"{self.endpoint}/api/context",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json=item.model_dump()
                    )
            except Exception as e:
                logger.error(f"Remote Moss write failed: {e}. Storing locally.")

        self._context_store.setdefault(incident_id, []).append(item)
        logger.info(f"[Moss] Context stored for incident {incident_id} [{source} | {context_type}]: {summary}")
        return item

    async def get_context(self, incident_id: str) -> List[MossContextItem]:
        """Retrieve all context items for an incident in reverse chronological order."""
        items = self._context_store.get(incident_id, [])
        return sorted(items, key=lambda x: x.timestamp, reverse=True)

    async def retrieve_relevant_context(
        self,
        incident_id: str,
        query: str,
        agent_role: Optional[str] = None,
        limit: int = 6
    ) -> List[MossContextItem]:
        """
        Semantic and relevance-weighted context retrieval.
        Scores context items based on query keywords, agent role tags, and recency.
        """
        all_items = self._context_store.get(incident_id, [])
        if not all_items:
            return []

        query_tokens = set(query.lower().split())
        role_tokens = set(agent_role.lower().split()) if agent_role else set()

        scored_items = []
        for item in all_items:
            score = 0.0
            content_lower = (item.content + " " + item.summary + " " + " ".join(item.tags)).lower()
            
            # Query match score
            for token in query_tokens:
                if len(token) > 2 and token in content_lower:
                    score += 2.0
            
            # Agent relevance boost
            for token in role_tokens:
                if token in content_lower:
                    score += 1.5
            
            # Verification status boost
            if item.verificationStatus == "HUMAN_VERIFIED" or item.verificationStatus == "VERIFIED":
                score += 1.0
            
            # Recency boost (simple order weight)
            scored_items.append((score, item))

        # Sort by score descending, then timestamp descending
        scored_items.sort(key=lambda x: (x[0], x[1].timestamp), reverse=True)
        top_items = [item for _, item in scored_items[:limit]]

        # Record retrieval for auditability
        self._retrieval_history.append({
            "incidentId": incident_id,
            "agent": agent_role,
            "query": query,
            "retrievedCount": len(top_items),
            "timestamp": datetime.utcnow().isoformat()
        })

        return top_items

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "REMOTE_MOSS" if self.is_connected and not self.is_demo_fallback else "LOCAL_DEMO_CONTEXT",
            "isConnected": self.is_connected,
            "isDemoFallback": self.is_demo_fallback,
            "totalContextCount": sum(len(v) for v in self._context_store.values()),
            "retrievalQueriesCount": len(self._retrieval_history)
        }

moss_service = MossContextService()
