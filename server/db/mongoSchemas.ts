import mongoose, { Schema, Document } from 'mongoose';
import type {
  IncidentSeverity,
  IncidentStatus,
  AgentName,
  AgentStateStatus,
  TaskStatus
} from './models.js';

// --- USER SCHEMA ---
export interface IUserDoc extends Document {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'COMMANDER_OPERATOR' | 'DISPATCHER' | 'FIELD_LEAD' | 'OBSERVER';
  department?: string;
  badgeNumber?: string;
  activeIncidentId?: string;
  createdAt: string;
}

const UserSchema = new Schema<IUserDoc>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['COMMANDER_OPERATOR', 'DISPATCHER', 'FIELD_LEAD', 'OBSERVER'],
    default: 'COMMANDER_OPERATOR'
  },
  department: { type: String, default: 'Emergency Operations Command' },
  badgeNumber: { type: String, default: 'EOC-701' },
  activeIncidentId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

// --- INCIDENT SCHEMA ---
export interface IIncidentDoc extends Document {
  incidentId: string;
  title: string;
  type: string;
  location: {
    address: string;
    lat: number;
    lng: number;
    zone?: string;
  };
  description: string;
  severity: IncidentSeverity;
  affectedPeople: number;
  hazards: string[];
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

const IncidentSchema = new Schema<IIncidentDoc>({
  incidentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, default: 'Emergency' },
  location: {
    address: { type: String, default: '' },
    lat: { type: Number, default: 37.7749 },
    lng: { type: Number, default: -122.4194 },
    zone: { type: String, default: 'Sector 1' }
  },
  description: { type: String, default: '' },
  severity: { type: String, default: 'HIGH' },
  affectedPeople: { type: Number, default: 0 },
  hazards: [{ type: String }],
  status: { type: String, default: 'REPORTED' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

// --- INCIDENT UPDATE SCHEMA ---
const IncidentUpdateSchema = new Schema({
  updateId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  source: { type: String, default: 'HUMAN' },
  author: { type: String, default: 'Operator' },
  content: { type: String, required: true },
  verified: { type: Boolean, default: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  affectedAgents: [{ type: String }]
});

// --- AGENT TASK SCHEMA ---
const AgentTaskSchema = new Schema({
  taskId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  agent: { type: String, required: true },
  task: { type: String, required: true },
  status: { type: String, default: 'PENDING' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  completedAt: { type: String }
});

// --- AGENT RESULT SCHEMA ---
const AgentResultSchema = new Schema({
  resultId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  agent: { type: String, required: true },
  result: { type: Schema.Types.Mixed, default: {} },
  confidence: { type: Number, default: 0.9 },
  contextItemsUsed: [{ type: String }],
  timestamp: { type: String, default: () => new Date().toISOString() }
});

// --- AGENT STATE SCHEMA ---
const AgentStateSchema = new Schema({
  incidentId: { type: String, required: true, index: true },
  agent: { type: String, required: true },
  status: { type: String, default: 'IDLE' },
  currentTask: { type: String, default: '' },
  contextCount: { type: Number, default: 0 },
  lastUpdated: { type: String, default: () => new Date().toISOString() },
  error: { type: String }
});
AgentStateSchema.index({ incidentId: 1, agent: 1 }, { unique: true });

// --- RESPONSE PLAN SCHEMA ---
const ResponsePlanSchema = new Schema({
  planId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  summary: { type: String, default: '' },
  priorities: [{ type: String }],
  immediateActions: [{ type: String }],
  responderAssignments: [
    {
      unit: String,
      task: String,
      priority: String,
      status: String
    }
  ],
  accessRoutes: {
    primaryBlocked: { type: Boolean, default: false },
    primaryBlockedReason: { type: String },
    alternateRoute: { type: String, default: '' },
    trafficConstraints: [{ type: String }]
  },
  medicalStrategy: {
    urgencyLevel: { type: String, default: 'UNKNOWN' },
    triageSummary: { type: String, default: '' },
    disclaimer: { type: String, default: '' }
  },
  publicSafetyAlert: { type: String, default: '' },
  conflictsDetected: [
    {
      id: String,
      title: String,
      agentsInvolved: [String],
      description: String,
      commanderAnalysis: String,
      resolution: String,
      resolvedAt: String
    }
  ],
  resolutionNotes: { type: String, default: '' },
  changeLog: [{ type: String }],
  whyExplanations: [
    {
      id: String,
      recommendation: String,
      responsibleAgent: String,
      informationConsidered: [String],
      contextRetrieved: [String],
      decisionSummary: String,
      uncertainty: String,
      timestamp: String
    }
  ],
  approvedBy: { type: String },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REASSESSMENT_REQUESTED'],
    default: 'PENDING'
  },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

// --- EMERGENCY RESOURCE SCHEMA ---
const EmergencyResourceSchema = new Schema({
  resourceId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  priority: { type: String, default: 'HIGH' },
  status: { type: String, default: 'REQUESTED' },
  reason: { type: String, default: '' },
  etaMinutes: { type: Number },
  dispatchedAt: { type: String }
});

// --- HUMAN ACTION SCHEMA ---
const HumanActionSchema = new Schema({
  actionId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  content: { type: String, default: '' },
  targetId: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

// --- AUDIT LOG SCHEMA ---
const AuditLogSchema = new Schema({
  logId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  actor: { type: String, required: true },
  actorType: { type: String, default: 'SYSTEM' },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

// --- MOSS CONTEXT ITEM SCHEMA ---
const MossContextSchema = new Schema({
  itemId: { type: String, required: true, unique: true },
  incidentId: { type: String, required: true, index: true },
  source: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

// Export mongoose models
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const IncidentModel = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);
export const IncidentUpdateModel = mongoose.models.IncidentUpdate || mongoose.model('IncidentUpdate', IncidentUpdateSchema);
export const AgentTaskModel = mongoose.models.AgentTask || mongoose.model('AgentTask', AgentTaskSchema);
export const AgentResultModel = mongoose.models.AgentResult || mongoose.model('AgentResult', AgentResultSchema);
export const AgentStateModel = mongoose.models.AgentState || mongoose.model('AgentState', AgentStateSchema);
export const ResponsePlanModel = mongoose.models.ResponsePlan || mongoose.model('ResponsePlan', ResponsePlanSchema);
export const EmergencyResourceModel = mongoose.models.EmergencyResource || mongoose.model('EmergencyResource', EmergencyResourceSchema);
export const HumanActionModel = mongoose.models.HumanAction || mongoose.model('HumanAction', HumanActionSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const MossContextModel = mongoose.models.MossContext || mongoose.model('MossContext', MossContextSchema);
