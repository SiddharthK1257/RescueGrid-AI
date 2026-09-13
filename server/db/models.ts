export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'ASSESSING' | 'ACTIVE RESPONSE' | 'ESCALATED' | 'CONTAINED' | 'RESOLVED';
export type AgentName = 'COMMANDER' | 'MEDICAL' | 'RESCUE' | 'TRAFFIC' | 'RESOURCE' | 'COMMUNICATION' | 'SITUATION';
export type AgentStateStatus = 'IDLE' | 'ASSIGNING' | 'ANALYZING' | 'REASSESSING' | 'COMPLETE' | 'SYNTHESIZING' | 'ERROR';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface User {
  userId: string;
  name: string;
  role: 'COMMANDER_OPERATOR' | 'DISPATCHER' | 'FIELD_LEAD' | 'OBSERVER';
  email: string;
  activeIncidentId?: string;
  createdAt: string;
}

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

export interface AgentTask {
  taskId: string;
  incidentId: string;
  agent: AgentName;
  task: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface AgentResult {
  resultId: string;
  incidentId: string;
  agent: AgentName;
  result: Record<string, any>;
  confidence: number;
  contextItemsUsed: string[];
  timestamp: string;
}

export interface AgentState {
  incidentId: string;
  agent: AgentName;
  status: AgentStateStatus;
  currentTask: string;
  contextCount: number;
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

export interface HumanAction {
  actionId: string;
  incidentId: string;
  user: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REASSESSMENT' | 'ADD_NOTE' | 'INJECT_UPDATE' | 'MARK_VERIFIED' | 'OVERRIDE_RESOURCE';
  content: string;
  targetId?: string;
  timestamp: string;
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
