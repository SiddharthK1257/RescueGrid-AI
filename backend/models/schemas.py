from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class Incident(BaseModel):
    incidentId: str
    type: str  # e.g., "TRAFFIC_COLLISION", "FIRE", "EARTHQUAKE", "FLOOD", "HAZMAT"
    title: Optional[str] = None
    location: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    locationSource: str = "USER_REPORTED"  # "USER_REPORTED", "GPS_LIVE", "SIMULATED", "OPERATOR_OVERRIDE"
    description: str
    severity: str = "MEDIUM"  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    affectedPeople: int = 0
    hazards: List[str] = Field(default_factory=list)
    status: str = "ACTIVE"  # "REPORTED", "ACTIVE", "CONTAINED", "RESOLVED", "REOPENED"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class AgentTask(BaseModel):
    taskId: str
    incidentId: str
    agentName: str
    taskDescription: str
    status: str = "PENDING"  # "PENDING", "RUNNING", "COMPLETED", "FAILED"
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    errorMessage: Optional[str] = None

class AgentResult(BaseModel):
    resultId: str
    incidentId: str
    agentName: str  # "COMMANDER", "MEDICAL", "RESCUE", "TRAFFIC", "RESOURCE", "COMMUNICATION", "MONITOR"
    findings: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    uncertainty: List[str] = Field(default_factory=list)
    contextReferences: List[str] = Field(default_factory=list)
    status: str = "COMPLETED"  # "IDLE", "ANALYZING", "COMPLETED", "UNAVAILABLE"
    urgencyScore: Optional[int] = Field(None, ge=1, le=10)
    data: Dict[str, Any] = Field(default_factory=dict)
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ResponseAction(BaseModel):
    id: str
    title: str
    agent: str
    priority: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    description: str
    estimatedTime: Optional[str] = None
    requiresApproval: bool = True
    approved: bool = False

class ResponsePlan(BaseModel):
    planId: str
    incidentId: str
    version: int = 1
    actions: List[ResponseAction] = Field(default_factory=list)
    rationale: str
    primaryObjective: Optional[str] = None
    uncertainties: List[str] = Field(default_factory=list)
    createdBy: str = "COMMANDER_AGENT"
    status: str = "PROPOSED"  # "PROPOSED", "APPROVED", "REJECTED", "SUPERSEDED"
    approvedBy: Optional[str] = None
    approvalNotes: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class IncidentUpdate(BaseModel):
    updateId: str
    incidentId: str
    source: str = "HUMAN_OPERATOR"  # "HUMAN_OPERATOR", "FIELD_RESPONDER", "CITIZEN", "SIMULATION"
    content: str
    verificationStatus: str = "UNVERIFIED"  # "UNVERIFIED", "VERIFIED", "SIMULATED", "DISPUTED"
    reportedBy: Optional[str] = "Operator"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class LocationRecord(BaseModel):
    locationId: str
    incidentId: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    source: str = "BROWSER_GEOLOCATION"  # "BROWSER_GEOLOCATION", "SIMULATED", "MANUAL"
    accuracy: Optional[float] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    isSimulated: bool = False
    verificationStatus: str = "UNVERIFIED"

class HumanAction(BaseModel):
    actionId: str
    incidentId: str
    userId: str
    actionType: str  # "PLAN_APPROVED", "PLAN_REJECTED", "INFO_VERIFIED", "REASSESSMENT_TRIGGERED", "OVERRIDE"
    content: str
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class AuditLog(BaseModel):
    logId: str
    incidentId: str
    actor: str  # "HUMAN:Operator", "AGENT:COMMANDER", "SYSTEM", etc.
    action: str
    summary: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = Field(default_factory=dict)

class MossContextItem(BaseModel):
    contextId: str
    incidentId: str
    source: str  # "USER_REPORTED", "AI_GENERATED", "HUMAN_VERIFIED", "SIMULATED", "UNKNOWN"
    type: str  # "INITIAL_REPORT", "AGENT_ASSESSMENT", "INCIDENT_UPDATE", "PLAN_SNAPSHOT", "OPERATOR_NOTE"
    content: str
    summary: str
    contributingAgent: Optional[str] = None
    version: int = 1
    verificationStatus: str = "UNVERIFIED"
    tags: List[str] = Field(default_factory=list)
    confidence: float = 1.0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class MapMarker(BaseModel):
    markerId: str
    incidentId: str
    title: str
    type: str  # "INCIDENT", "USER_LOCATION", "HAZARD", "ROAD_BLOCK", "MEDICAL_UNIT", "STAGING_AREA"
    latitude: float
    longitude: float
    severity: Optional[str] = "MEDIUM"
    status: Optional[str] = "ACTIVE"
    description: Optional[str] = None
    isSimulated: bool = False
    verificationStatus: str = "UNVERIFIED"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class LiveKitTokenRequest(BaseModel):
    roomName: str
    participantName: str
    participantIdentity: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class LiveKitTokenResponse(BaseModel):
    token: str
    roomName: str
    participantName: str
    livekitUrl: str
    expiresAt: str
    isDemoFallback: bool = False

class UpdateInjectRequest(BaseModel):
    content: str
    source: str = "HUMAN_OPERATOR"
    verificationStatus: str = "VERIFIED"
    isSimulated: bool = True

class PlanApprovalRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None
    operatorId: str = "Operator_1"

class ReassessRequest(BaseModel):
    reason: Optional[str] = "Human operator requested full reassessment."

class UserAccount(BaseModel):
    userId: str
    name: str
    email: str
    passwordHash: str
    role: str = "COMMANDER_OPERATOR"
    department: str = "Emergency Operations Command"
    badgeNumber: str = "RG-9001"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class AuthUser(BaseModel):
    userId: str
    name: str
    email: str
    role: str
    department: str
    badgeNumber: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "COMMANDER_OPERATOR"
    department: Optional[str] = "Emergency Operations Command"
    badgeNumber: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    token: Optional[str] = None
    user: Optional[AuthUser] = None
    error: Optional[str] = None

