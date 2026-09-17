export type IncidentType =
  | 'TRAFFIC_COLLISION'
  | 'FIRE'
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'HAZMAT'
  | 'STRUCTURAL_COLLAPSE';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'REOPENED';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'SIMULATED' | 'DISPUTED';

export type AgentName =
  | 'COMMANDER'
  | 'MEDICAL'
  | 'RESCUE'
  | 'TRAFFIC'
  | 'RESOURCE'
  | 'COMMUNICATION'
  | 'MONITOR';

export interface Incident {
  incidentId: string;
  type: IncidentType | string;
  title?: string;
  location: string;
  latitude: number;
  longitude: number;
  locationSource: 'USER_REPORTED' | 'GPS_LIVE' | 'SIMULATED' | 'OPERATOR_OVERRIDE';
  description: string;
  severity: SeverityLevel;
  affectedPeople: number;
  hazards: string[];
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentUpdate {
  updateId: string;
  incidentId: string;
  source: 'HUMAN_OPERATOR' | 'FIELD_RESPONDER' | 'CITIZEN' | 'SIMULATION';
  content: string;
  verificationStatus: VerificationStatus;
  reportedBy?: string;
  createdAt: string;
}

export interface AgentResult {
  resultId: string;
  incidentId: string;
  agentName: AgentName | string;
  findings: string[];
  recommendations: string[];
  uncertainty: string[];
  contextReferences: string[];
  status: 'IDLE' | 'ANALYZING' | 'COMPLETED' | 'UNAVAILABLE';
  urgencyScore?: number;
  data?: Record<string, any>;
  createdAt: string;
}

export interface ResponseAction {
  id: string;
  title: string;
  agent: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  estimatedTime?: string;
  requiresApproval: boolean;
  approved: boolean;
}

export interface ResponsePlan {
  planId: string;
  incidentId: string;
  version: number;
  actions: ResponseAction[];
  rationale: string;
  primaryObjective?: string;
  uncertainties: string[];
  createdBy: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: string;
}

export interface MossContextItem {
  contextId: string;
  incidentId: string;
  source: 'USER_REPORTED' | 'AI_GENERATED' | 'HUMAN_VERIFIED' | 'SIMULATED' | 'UNKNOWN';
  type: 'INITIAL_REPORT' | 'AGENT_ASSESSMENT' | 'INCIDENT_UPDATE' | 'PLAN_SNAPSHOT' | 'OPERATOR_NOTE';
  content: string;
  summary: string;
  contributingAgent?: string;
  version: number;
  verificationStatus: VerificationStatus;
  tags: string[];
  confidence: number;
  timestamp: string;
}

export interface MapMarker {
  markerId: string;
  incidentId: string;
  title: string;
  type: 'INCIDENT' | 'USER_LOCATION' | 'HAZARD' | 'ROAD_BLOCK' | 'MEDICAL_UNIT' | 'STAGING_AREA';
  latitude: number;
  longitude: number;
  severity?: SeverityLevel;
  status?: string;
  description?: string;
  isSimulated: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface LocationRecord {
  locationId: string;
  incidentId: string;
  latitude: number;
  longitude: number;
  source: 'BROWSER_GEOLOCATION' | 'SIMULATED' | 'MANUAL';
  accuracy?: number;
  timestamp: string;
  isSimulated: boolean;
  verificationStatus: VerificationStatus;
}

export interface AuditLog {
  logId: string;
  incidentId: string;
  actor: string;
  action: string;
  summary: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LiveKitTokenResponse {
  token: string;
  roomName: string;
  participantName: string;
  livekitUrl: string;
  expiresAt: string;
  isDemoFallback: boolean;
}

export interface SystemHealth {
  status: string;
  system: string;
  timestamp: string;
  services: {
    geminiAiReasoning: { status: string; mode: string };
    mossSharedContext: { status: string; mode: string; isDemoFallback: boolean; totalContextCount: number };
    livekitCollaboration: { status: string; url: string };
    mongoDbPersistence: { status: string; isFallback: boolean };
    interactiveMapService: { status: string; provider: string; liveLocationSupported: boolean };
  };
  safetyNotice: string;
}

export type PersonnelRole = 'COMMANDER_OPERATOR' | 'DISPATCHER' | 'FIELD_LEAD' | 'OBSERVER';


export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: PersonnelRole | string;
  department: string;
  badgeNumber: string;
  password?: string;
}
