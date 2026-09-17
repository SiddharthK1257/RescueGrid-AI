import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.models.schemas import AuditLog
from backend.services.db_service import db_service

logger = logging.getLogger("rescuegrid.audit")

class AuditService:
    async def log_action(
        self,
        incident_id: str,
        actor: str,
        action: str,
        summary: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        log = AuditLog(
            logId=f"LOG-{uuid.uuid4().hex[:8].upper()}",
            incidentId=incident_id,
            actor=actor,
            action=action,
            summary=summary,
            timestamp=datetime.utcnow().isoformat(),
            metadata=metadata or {}
        )
        await db_service.save_audit_log(log)
        logger.info(f"[Audit] {actor} -> {action}: {summary}")
        return log

    async def get_timeline(self, incident_id: str) -> List[AuditLog]:
        return await db_service.get_audit_logs(incident_id)

audit_service = AuditService()
