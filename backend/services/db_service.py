import os
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from backend.config import config
from backend.models.schemas import (
    Incident, IncidentUpdate, ResponsePlan, AgentResult, AuditLog, MapMarker, LocationRecord, UserAccount
)

logger = logging.getLogger("rescuegrid.db")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "mongo_db"

class DatabaseService:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self.fallback_mode = False
        self.storage_mode = "LOCAL_DOCUMENT_STORE"
        
        # Ensure local persistent data directory exists
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # In-memory storage cache
        self._incidents: Dict[str, Incident] = {}
        self._updates: Dict[str, List[IncidentUpdate]] = {}
        self._plans: Dict[str, List[ResponsePlan]] = {}
        self._agent_results: Dict[str, List[AgentResult]] = {}
        self._audit_logs: Dict[str, List[AuditLog]] = {}
        self._markers: Dict[str, List[MapMarker]] = {}
        self._locations: Dict[str, List[LocationRecord]] = {}
        self._users: Dict[str, UserAccount] = {}
        
        # Load any existing persistent data from disk on boot
        self._load_from_disk()

    def _file_path(self, collection_name: str) -> Path:
        return DATA_DIR / f"{collection_name}.json"

    def _load_from_disk(self):
        """Load persistent records from local JSON files to guarantee zero data loss."""
        try:
            # Users
            f = self._file_path("users")
            if f.exists():
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    for item in data:
                        u = UserAccount(**item)
                        self._users[u.userId] = u
            
            # Incidents
            f = self._file_path("incidents")
            if f.exists():
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    for item in data:
                        inc = Incident(**item)
                        self._incidents[inc.incidentId] = inc

            # Updates
            f = self._file_path("updates")
            if f.exists():
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    for item in data:
                        up = IncidentUpdate(**item)
                        self._updates.setdefault(up.incidentId, []).append(up)

            # Plans
            f = self._file_path("plans")
            if f.exists():
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    for item in data:
                        p = ResponsePlan(**item)
                        self._plans.setdefault(p.incidentId, []).append(p)

            # Audit Logs
            f = self._file_path("audit_logs")
            if f.exists():
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    for item in data:
                        al = AuditLog(**item)
                        self._audit_logs.setdefault(al.incidentId, []).append(al)

            # Map Markers
            f = self._file_path("markers")
            if f.exists():
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    for item in data:
                        m = MapMarker(**item)
                        self._markers.setdefault(m.incidentId, []).append(m)

            logger.info(f"Loaded persistent data: {len(self._incidents)} incidents, {len(self._users)} users.")
        except Exception as e:
            logger.warning(f"Failed loading persistent local data: {e}")

    def _save_collection_to_disk(self, collection_name: str, records: List[Dict[str, Any]]):
        """Persist a collection to disk in JSON format."""
        try:
            f = self._file_path(collection_name)
            with open(f, "w", encoding="utf-8") as fp:
                json.dump(records, fp, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error persisting collection {collection_name} to disk: {e}")

    async def connect(self):
        """Connect to MongoDB Atlas or local MongoDB service."""
        raw_uri = config.MONGODB_URI
        if "<db_username>" in raw_uri:
            if config.DB_USERNAME:
                raw_uri = raw_uri.replace("<db_username>", config.DB_USERNAME)
        
        # Test MongoDB Atlas connection
        if raw_uri and "mongodb" in raw_uri and "<" not in raw_uri and ">" not in raw_uri:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                logger.info(f"Attempting MongoDB connection: {raw_uri.split('@')[-1] if '@' in raw_uri else raw_uri}...")
                self.client = AsyncIOMotorClient(raw_uri, serverSelectionTimeoutMS=3000)
                await self.client.admin.command('ping')
                self.db = self.client.get_database("rescuegrid")
                self.is_connected = True
                self.fallback_mode = False
                self.storage_mode = "MONGODB_ATLAS"
                logger.info("Successfully connected to MongoDB Atlas! Real collections active.")
                
                # Sync local persistent data up to MongoDB
                await self._sync_to_mongo()
                return
            except Exception as e:
                logger.warning(f"MongoDB Atlas connection failed: {e}. Activating Persistent Local Document Engine.")
        else:
            logger.info("MongoDB URI contains unresolved placeholders or is not set. Operating on Persistent Local Document Engine.")
            
        self.fallback_mode = True
        self.is_connected = False
        self.storage_mode = "LOCAL_DOCUMENT_STORE"

    async def _sync_to_mongo(self):
        """Sync persistent items into MongoDB upon successful connection."""
        if not self.is_connected or self.db is None:
            return
        try:
            for inc in self._incidents.values():
                await self.db.incidents.update_one({"incidentId": inc.incidentId}, {"$set": inc.model_dump()}, upsert=True)
            for user in self._users.values():
                await self.db.users.update_one({"userId": user.userId}, {"$set": user.model_dump()}, upsert=True)
            logger.info("Local persistent records synchronized with MongoDB Atlas.")
        except Exception as e:
            logger.warning(f"Sync to MongoDB Atlas notice: {e}")

    # --- USERS ---
    async def save_user(self, user: UserAccount) -> UserAccount:
        self._users[user.userId] = user
        self._save_collection_to_disk("users", [u.model_dump() for u in self._users.values()])
        if self.is_connected and self.db is not None:
            try:
                await self.db.users.update_one(
                    {"userId": user.userId},
                    {"$set": user.model_dump()},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving user to Mongo: {e}")
        return user

    async def get_user_by_email(self, email: str) -> Optional[UserAccount]:
        clean = email.strip().lower()
        if self.is_connected and self.db is not None:
            try:
                doc = await self.db.users.find_one({"email": clean})
                if doc:
                    doc.pop("_id", None)
                    return UserAccount(**doc)
            except Exception as e:
                logger.error(f"Error getting user from Mongo: {e}")
        for u in self._users.values():
            if u.email.strip().lower() == clean:
                return u
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserAccount]:
        if self.is_connected and self.db is not None:
            try:
                doc = await self.db.users.find_one({"userId": user_id})
                if doc:
                    doc.pop("_id", None)
                    return UserAccount(**doc)
            except Exception as e:
                logger.error(f"Error getting user from Mongo: {e}")
        return self._users.get(user_id)

    async def get_all_users(self) -> List[UserAccount]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.users.find()
                docs = await cursor.to_list(length=100)
                if docs:
                    return [UserAccount(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error getting all users from Mongo: {e}")
        return list(self._users.values())

    # --- INCIDENTS ---
    async def save_incident(self, incident: Incident) -> Incident:
        incident.updatedAt = datetime.utcnow().isoformat()
        self._incidents[incident.incidentId] = incident
        self._save_collection_to_disk("incidents", [inc.model_dump() for inc in self._incidents.values()])
        if self.is_connected and self.db is not None:
            try:
                await self.db.incidents.update_one(
                    {"incidentId": incident.incidentId},
                    {"$set": incident.model_dump()},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving incident to Mongo: {e}")
        return incident

    async def get_incident(self, incident_id: str) -> Optional[Incident]:
        if self.is_connected and self.db is not None:
            try:
                doc = await self.db.incidents.find_one({"incidentId": incident_id})
                if doc:
                    doc.pop("_id", None)
                    return Incident(**doc)
            except Exception as e:
                logger.error(f"Error fetching incident from Mongo: {e}")
        return self._incidents.get(incident_id)

    async def get_incidents(self) -> List[Incident]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.incidents.find()
                docs = await cursor.to_list(length=100)
                if docs:
                    return [Incident(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error listing incidents from Mongo: {e}")
        return list(self._incidents.values())

    async def update_incident(self, incident_id: str, updates: Dict[str, Any]) -> Optional[Incident]:
        inc = await self.get_incident(incident_id)
        if not inc:
            return None
        data = inc.model_dump()
        data.update(updates)
        data["updatedAt"] = datetime.utcnow().isoformat()
        updated_inc = Incident(**data)
        return await self.save_incident(updated_inc)

    # --- UPDATES ---
    async def save_update(self, update: IncidentUpdate) -> IncidentUpdate:
        self._updates.setdefault(update.incidentId, []).append(update)
        all_updates = [u.model_dump() for ups in self._updates.values() for u in ups]
        self._save_collection_to_disk("updates", all_updates)
        if self.is_connected and self.db is not None:
            try:
                await self.db.updates.insert_one(update.model_dump())
            except Exception as e:
                logger.error(f"Error saving update to Mongo: {e}")
        return update

    async def get_updates(self, incident_id: str) -> List[IncidentUpdate]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.updates.find({"incidentId": incident_id}).sort("createdAt", -1)
                docs = await cursor.to_list(length=100)
                if docs:
                    return [IncidentUpdate(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error getting updates from Mongo: {e}")
        return self._updates.get(incident_id, [])

    # --- PLANS ---
    async def save_plan(self, plan: ResponsePlan) -> ResponsePlan:
        existing = self._plans.setdefault(plan.incidentId, [])
        # Replace if same version or append
        self._plans[plan.incidentId] = [p for p in existing if p.version != plan.version] + [plan]
        all_plans = [p.model_dump() for plist in self._plans.values() for p in plist]
        self._save_collection_to_disk("plans", all_plans)
        if self.is_connected and self.db is not None:
            try:
                await self.db.plans.update_one(
                    {"planId": plan.planId},
                    {"$set": plan.model_dump()},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving plan to Mongo: {e}")
        return plan

    async def get_plans(self, incident_id: str) -> List[ResponsePlan]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.plans.find({"incidentId": incident_id}).sort("version", -1)
                docs = await cursor.to_list(length=100)
                if docs:
                    return [ResponsePlan(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error getting plans from Mongo: {e}")
        plans = self._plans.get(incident_id, [])
        return sorted(plans, key=lambda p: p.version, reverse=True)

    async def get_latest_plan(self, incident_id: str) -> Optional[ResponsePlan]:
        plans = await self.get_plans(incident_id)
        return plans[0] if plans else None

    # --- AGENT RESULTS ---
    async def save_agent_result(self, result: AgentResult) -> AgentResult:
        existing = self._agent_results.setdefault(result.incidentId, [])
        self._agent_results[result.incidentId] = [r for r in existing if r.agentName != result.agentName] + [result]
        all_results = [r.model_dump() for rlist in self._agent_results.values() for r in rlist]
        self._save_collection_to_disk("agent_results", all_results)
        if self.is_connected and self.db is not None:
            try:
                await self.db.agent_results.update_one(
                    {"incidentId": result.incidentId, "agentName": result.agentName},
                    {"$set": result.model_dump()},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving agent result to Mongo: {e}")
        return result

    async def get_agent_results(self, incident_id: str) -> List[AgentResult]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.agent_results.find({"incidentId": incident_id}).sort("createdAt", -1)
                docs = await cursor.to_list(length=100)
                if docs:
                    return [AgentResult(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error getting agent results from Mongo: {e}")
        return self._agent_results.get(incident_id, [])

    # --- AUDIT LOGS ---
    async def save_audit_log(self, log: AuditLog) -> AuditLog:
        self._audit_logs.setdefault(log.incidentId, []).append(log)
        all_logs = [l.model_dump() for llist in self._audit_logs.values() for l in llist]
        self._save_collection_to_disk("audit_logs", all_logs)
        if self.is_connected and self.db is not None:
            try:
                await self.db.audit_logs.insert_one(log.model_dump())
            except Exception as e:
                logger.error(f"Error saving audit log to Mongo: {e}")
        return log

    async def get_audit_logs(self, incident_id: str) -> List[AuditLog]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.audit_logs.find({"$or": [{"incidentId": incident_id}, {"incidentId": "SYSTEM"}]}).sort("timestamp", -1)
                docs = await cursor.to_list(length=200)
                if docs:
                    return [AuditLog(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error getting audit logs from Mongo: {e}")
        logs = self._audit_logs.get(incident_id, []) + self._audit_logs.get("SYSTEM", [])
        # Deduplicate by logId
        seen = set()
        unique = []
        for item in sorted(logs, key=lambda l: l.timestamp, reverse=True):
            if item.logId not in seen:
                seen.add(item.logId)
                unique.append(item)
        return unique

    # --- MAP MARKERS ---
    async def save_marker(self, marker: MapMarker) -> MapMarker:
        existing = self._markers.setdefault(marker.incidentId, [])
        self._markers[marker.incidentId] = [m for m in existing if m.markerId != marker.markerId] + [marker]
        all_markers = [m.model_dump() for mlist in self._markers.values() for m in mlist]
        self._save_collection_to_disk("markers", all_markers)
        if self.is_connected and self.db is not None:
            try:
                await self.db.markers.update_one(
                    {"markerId": marker.markerId},
                    {"$set": marker.model_dump()},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving marker to Mongo: {e}")
        return marker

    async def get_markers(self, incident_id: str) -> List[MapMarker]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.markers.find({"incidentId": incident_id})
                docs = await cursor.to_list(length=100)
                if docs:
                    return [MapMarker(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]
            except Exception as e:
                logger.error(f"Error getting markers from Mongo: {e}")
        return self._markers.get(incident_id, [])

    # --- LOCATIONS ---
    async def save_location(self, loc: LocationRecord) -> LocationRecord:
        self._locations.setdefault(loc.incidentId, []).append(loc)
        return loc

    async def get_locations(self, incident_id: str) -> List[LocationRecord]:
        return self._locations.get(incident_id, [])

db_service = DatabaseService()
