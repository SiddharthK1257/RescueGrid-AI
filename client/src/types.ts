export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'ASSESSING' | 'ACTIVE RESPONSE' | 'ESCALATED' | 'CONTAINED' | 'RESOLVED';
export type AgentName = 'COMMANDER' | 'MEDICAL' | 'RESCUE' | 'TRAFFIC' | 'RESOURCE' | 'COMMUNICATION' | 'SITUATION';
export type AgentStateStatus = 'IDLE' | 'ASSIGNING' | 'ANALYZING' | 'REASSESSING' | 'COMPLETE' | 'SYNTHESIZING' | 'ERROR';

export interface IncidentLocation {
  address: string;
  lat: number;
  lng: number;
  zone?: string;
}

export interface Incident {
  incidentId: string;
  title: string;
  type: string;
  location: IncidentLocation;
  description: string;
  severity: IncidentSeverity;
  affectedPeople: number;
  hazards: string[];
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentUpdate {
  updateId: string;
  incidentId: string;
  source: 'HUMAN' | 'SENSOR' | 'FIELD_UNIT' | 'COMMANDER';
  author: string;
  content: string;
  verified: boolean;
  timestamp: string;
  affectedAgents?: AgentName[];
}

export interface MossContextItem {
  id: string;
  incidentId: string;
  source: 'HUMAN' | 'COMMANDER' | 'MEDICAL' | 'RESCUE' | 'TRAFFIC' | 'RESOURCE' | 'COMMUNICATION' | 'SITUATION' | 'SYSTEM';
  type:
    | 'INITIAL_REPORT'
    | 'HUMAN_UPDATE'
    | 'AGENT_ASSESSMENT'
    | 'COMMANDER_DECISION'
    | 'ENVIRONMENTAL_UPDATE'
    | 'REVISED_PLAN'
    | 'VERIFIED_FACT'
    | 'CONFLICT_RESOLUTION';
  content: string;
  summary: string;
  metadata: {
    tags: string[];
    confidence?: number;
    agent?: AgentName;
    importance: number;
    relevanceScore?: number;
  };
  timestamp: string;
}

export interface MossAgentState {
  incidentId: string;
  agent: AgentName;
  status: AgentStateStatus;
  currentTask: string;
  contextRetrieved: number;
  lastUpdated: string;
  error?: string;
}

export interface ConflictItem {
  id: string;
  title: string;
  agentsInvolved: AgentName[];
  description: string;
  commanderAnalysis: string;
  resolution: string;
  resolvedAt: string;
}

export interface ExplainabilityItem {
  id: string;
  recommendation: string;
  responsibleAgent: AgentName;
  informationConsidered: string[];
  contextRetrieved: string[];
  decisionSummary: string;
  uncertainty: string;
  timestamp: string;
}

export interface ResponsePlan {
  planId: string;
  incidentId: string;
  version: number;
  summary: string;
  priorities: string[];
  immediateActions: string[];
  responderAssignments: Array<{ unit: string; task: string; priority: string; status: string }>;
  accessRoutes: {
    primaryBlocked: boolean;
    primaryBlockedReason?: string;
    alternateRoute: string;
    trafficConstraints: string[];
  };
  medicalStrategy: {
    urgencyLevel: 'CRITICAL' | 'URGENT' | 'NON-URGENT' | 'UNKNOWN';
    triageSummary: string;
    disclaimer: string;
  };
  publicSafetyAlert: string;
  conflictsDetected: ConflictItem[];
  resolutionNotes: string;
  changeLog?: string[];
  whyExplanations: ExplainabilityItem[];
  approvedBy?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REASSESSMENT_REQUESTED';
  createdAt: string;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'COMMANDER_OPERATOR' | 'DISPATCHER' | 'FIELD_LEAD' | 'OBSERVER';
  department?: string;
  badgeNumber?: string;
}

export interface EmergencyResource {
  resourceId: string;
  incidentId: string;
  name: string;
  type: 'AMBULANCE' | 'FIRE RESPONSE' | 'RESCUE TEAM' | 'POLICE / TRAFFIC CONTROL' | 'MEDICAL TEAM' | 'HEAVY RESCUE EQUIPMENT' | 'COMMUNICATION SUPPORT';
  quantity: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REQUESTED' | 'EN_ROUTE' | 'ON_SCENE' | 'STANDBY' | 'DISPATCHED';
  reason: string;
  etaMinutes?: number;
  dispatchedAt?: string;
}

export interface AuditLog {
  logId: string;
  incidentId: string;
  actor: string;
  actorType: 'HUMAN' | 'AGENT' | 'MOSS' | 'SYSTEM';
  action: string;
  details: string;
  timestamp: string;
}

export interface LiveActivity {
  id: string;
  incidentId: string;
  agent: string;
  message: string;
  type: 'info' | 'moss' | 'agent' | 'commander' | 'alert';
  timestamp: string;
}

export interface SettingsStatus {
  db: {
    connected: boolean;
    type: 'MONGODB_ATLAS' | 'LOCAL_HIGH_SPEED_STORE';
    uriSanitized: string;
    lastChecked: string;
    error?: string;
  };
  gemini: {
    configured: boolean;
    maskedKey: string;
    model: string;
  };
  moss: {
    externalConfigured: boolean;
    endpoint: string;
    maskedKey: string;
  };
  port: number;
}
