import mongoose from 'mongoose';
import { config } from '../config.js';
import type {
  User,
  Incident,
  IncidentUpdate,
  AgentTask,
  AgentResult,
  AgentState,
  ResponsePlan,
  EmergencyResource,
  HumanAction,
  AuditLog
} from './models.js';

export class LocalDocumentStore {
  users: Map<string, User> = new Map();
  incidents: Map<string, Incident> = new Map();
  incident_updates: Map<string, IncidentUpdate> = new Map();
  agent_tasks: Map<string, AgentTask> = new Map();
  agent_results: Map<string, AgentResult> = new Map();
  agent_states: Map<string, AgentState> = new Map();
  response_plans: Map<string, ResponsePlan> = new Map();
  resources: Map<string, EmergencyResource> = new Map();
  human_actions: Map<string, HumanAction> = new Map();
  audit_logs: Map<string, AuditLog> = new Map();

  clear() {
    this.users.clear();
    this.incidents.clear();
    this.incident_updates.clear();
    this.agent_tasks.clear();
    this.agent_results.clear();
    this.agent_states.clear();
    this.response_plans.clear();
    this.resources.clear();
    this.human_actions.clear();
    this.audit_logs.clear();
  }
}

export const localStore = new LocalDocumentStore();

export interface DbStatus {
  connected: boolean;
  type: 'MONGODB_ATLAS' | 'LOCAL_HIGH_SPEED_STORE';
  uriSanitized: string;
  lastChecked: string;
  error?: string;
}

export let dbStatus: DbStatus = {
  connected: false,
  type: 'LOCAL_HIGH_SPEED_STORE',
  uriSanitized: 'cluster0.jmxqta5.mongodb.net',
  lastChecked: new Date().toISOString()
};

export async function connectToDatabase(): Promise<DbStatus> {
  let rawUri = config.mongoUri;
  if (rawUri.includes('<db_username>')) {
    if (config.dbUsername) {
      rawUri = rawUri.replace('<db_username>', config.dbUsername);
    }
  }

  // Sanitize URI for safe display
  const sanitized = rawUri.replace(/:([^@]+)@/, ':****@');
  dbStatus.uriSanitized = sanitized;
  dbStatus.lastChecked = new Date().toISOString();

  // If URI still contains unresolved placeholder, use local store
  if (rawUri.includes('<') || rawUri.includes('>')) {
    console.log('[DB] Notice: MongoDB URI contains placeholder (<db_username>). Using resilient Local In-Memory Store.');
    dbStatus = {
      connected: true,
      type: 'LOCAL_HIGH_SPEED_STORE',
      uriSanitized: sanitized,
      lastChecked: new Date().toISOString(),
      error: 'Unresolved <db_username> placeholder in URI. Provide your Atlas username in Settings or .env to sync with MongoDB Atlas.'
    };
    return dbStatus;
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log(`[DB] Attempting MongoDB Atlas connection to ${sanitized}...`);
    await mongoose.connect(rawUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('[DB] Successfully connected to MongoDB Atlas!');
    dbStatus = {
      connected: true,
      type: 'MONGODB_ATLAS',
      uriSanitized: sanitized,
      lastChecked: new Date().toISOString()
    };
    return dbStatus;
  } catch (err: any) {
    console.warn(`[DB] MongoDB Atlas connection failed (${err.message}). Activating Local High-Speed Document Store.`);
    dbStatus = {
      connected: true,
      type: 'LOCAL_HIGH_SPEED_STORE',
      uriSanitized: sanitized,
      lastChecked: new Date().toISOString(),
      error: err.message
    };
    return dbStatus;
  }
}
