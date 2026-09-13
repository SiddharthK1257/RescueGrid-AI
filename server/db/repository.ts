import mongoose from 'mongoose';
import { localStore } from './connection.js';
import {
  UserModel,
  IncidentModel,
  IncidentUpdateModel,
  AgentTaskModel,
  AgentResultModel,
  AgentStateModel,
  ResponsePlanModel,
  EmergencyResourceModel,
  HumanActionModel,
  AuditLogModel,
  MossContextModel
} from './mongoSchemas.js';
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
  AuditLog,
  AgentName
} from './models.js';

function isMongoConnected(): boolean {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

export interface UserAccount extends User {
  passwordHash: string;
  department?: string;
  badgeNumber?: string;
}

export const repository = {
  // --- USERS & AUTH ---
  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected()) {
      try {
        const doc = await UserModel.findOne({ email: cleanEmail }).lean();
        if (doc) return doc as unknown as UserAccount;
      } catch (err) {
        console.warn('[Repository] MongoDB getUserByEmail error, using local store:', err);
      }
    }
    for (const u of localStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return u as UserAccount;
      }
    }
    return null;
  },

  async getUserById(userId: string): Promise<UserAccount | null> {
    if (isMongoConnected()) {
      try {
        const doc = await UserModel.findOne({ userId }).lean();
        if (doc) return doc as unknown as UserAccount;
      } catch (err) {
        console.warn('[Repository] MongoDB getUserById error, using local store:', err);
      }
    }
    const user = localStore.users.get(userId);
    return (user as UserAccount) || null;
  },

  async saveUser(user: UserAccount): Promise<UserAccount> {
    localStore.users.set(user.userId, user);
    if (isMongoConnected()) {
      try {
        await UserModel.findOneAndUpdate(
          { userId: user.userId },
          { $set: user },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB saveUser error:', err);
      }
    }
    return user;
  },

  async getAllUsers(): Promise<UserAccount[]> {
    if (isMongoConnected()) {
      try {
        const docs = await UserModel.find({}).lean();
        if (docs.length > 0) return docs as unknown as UserAccount[];
      } catch (err) {
        console.warn('[Repository] MongoDB getAllUsers error:', err);
      }
    }
    return Array.from(localStore.users.values()) as UserAccount[];
  },

  // --- INCIDENTS ---
  async getIncidents(): Promise<Incident[]> {
    if (isMongoConnected()) {
      try {
        const docs = await IncidentModel.find({}).sort({ updatedAt: -1 }).lean();
        if (docs.length > 0) {
          // Sync into localStore cache
          docs.forEach((d) => localStore.incidents.set(d.incidentId, d as unknown as Incident));
          return docs as unknown as Incident[];
        }
      } catch (err) {
        console.warn('[Repository] MongoDB getIncidents error, using local store:', err);
      }
    }
    return Array.from(localStore.incidents.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getIncident(incidentId: string): Promise<Incident | null> {
    if (isMongoConnected()) {
      try {
        const doc = await IncidentModel.findOne({ incidentId }).lean();
        if (doc) {
          localStore.incidents.set(incidentId, doc as unknown as Incident);
          return doc as unknown as Incident;
        }
      } catch (err) {
        console.warn('[Repository] MongoDB getIncident error:', err);
      }
    }
    return localStore.incidents.get(incidentId) || null;
  },

  async saveIncident(incident: Incident): Promise<Incident> {
    incident.updatedAt = new Date().toISOString();
    localStore.incidents.set(incident.incidentId, incident);

    if (isMongoConnected()) {
      try {
        await IncidentModel.findOneAndUpdate(
          { incidentId: incident.incidentId },
          { $set: incident },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB saveIncident error:', err);
      }
    }
    return incident;
  },

  // --- UPDATES ---
  async getUpdates(incidentId: string): Promise<IncidentUpdate[]> {
    if (isMongoConnected()) {
      try {
        const docs = await IncidentUpdateModel.find({ incidentId }).sort({ timestamp: -1 }).lean();
        if (docs.length > 0) {
          docs.forEach((d) => localStore.incident_updates.set(d.updateId, d as unknown as IncidentUpdate));
          return docs as unknown as IncidentUpdate[];
        }
      } catch (err) {
        console.warn('[Repository] MongoDB getUpdates error:', err);
      }
    }
    return Array.from(localStore.incident_updates.values())
      .filter((u) => u.incidentId === incidentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addUpdate(update: IncidentUpdate): Promise<IncidentUpdate> {
    localStore.incident_updates.set(update.updateId, update);
    if (isMongoConnected()) {
      try {
        await IncidentUpdateModel.findOneAndUpdate(
          { updateId: update.updateId },
          { $set: update },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB addUpdate error:', err);
      }
    }
    return update;
  },

  // --- AGENT TASKS ---
  async getTasks(incidentId: string): Promise<AgentTask[]> {
    if (isMongoConnected()) {
      try {
        const docs = await AgentTaskModel.find({ incidentId }).sort({ createdAt: -1 }).lean();
        if (docs.length > 0) return docs as unknown as AgentTask[];
      } catch (err) {
        console.warn('[Repository] MongoDB getTasks error:', err);
      }
    }
    return Array.from(localStore.agent_tasks.values())
      .filter((t) => t.incidentId === incidentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveTask(task: AgentTask): Promise<AgentTask> {
    localStore.agent_tasks.set(task.taskId, task);
    if (isMongoConnected()) {
      try {
        await AgentTaskModel.findOneAndUpdate(
          { taskId: task.taskId },
          { $set: task },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB saveTask error:', err);
      }
    }
    return task;
  },

  // --- AGENT RESULTS ---
  async getResults(incidentId: string): Promise<AgentResult[]> {
    if (isMongoConnected()) {
      try {
        const docs = await AgentResultModel.find({ incidentId }).sort({ timestamp: -1 }).lean();
        if (docs.length > 0) return docs as unknown as AgentResult[];
      } catch (err) {
        console.warn('[Repository] MongoDB getResults error:', err);
      }
    }
    return Array.from(localStore.agent_results.values())
      .filter((r) => r.incidentId === incidentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async saveResult(result: AgentResult): Promise<AgentResult> {
    localStore.agent_results.set(result.resultId, result);
    if (isMongoConnected()) {
      try {
        await AgentResultModel.findOneAndUpdate(
          { resultId: result.resultId },
          { $set: result },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB saveResult error:', err);
      }
    }
    return result;
  },

  // --- AGENT STATES ---
  async getAgentStates(incidentId: string): Promise<AgentState[]> {
    if (isMongoConnected()) {
      try {
        const docs = await AgentStateModel.find({ incidentId }).lean();
        if (docs.length > 0) return docs as unknown as AgentState[];
      } catch (err) {
        console.warn('[Repository] MongoDB getAgentStates error:', err);
      }
    }
    return Array.from(localStore.agent_states.values()).filter((s) => s.incidentId === incidentId);
  },

  async setAgentState(state: AgentState): Promise<AgentState> {
    const key = `${state.incidentId}:${state.agent}`;
    state.lastUpdated = new Date().toISOString();
    localStore.agent_states.set(key, state);

    if (isMongoConnected()) {
      try {
        await AgentStateModel.findOneAndUpdate(
          { incidentId: state.incidentId, agent: state.agent },
          { $set: state },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB setAgentState error:', err);
      }
    }
    return state;
  },

  // --- RESPONSE PLANS ---
  async getPlans(incidentId: string): Promise<ResponsePlan[]> {
    if (isMongoConnected()) {
      try {
        const docs = await ResponsePlanModel.find({ incidentId }).sort({ version: -1 }).lean();
        if (docs.length > 0) {
          docs.forEach((d) => localStore.response_plans.set(d.planId, d as unknown as ResponsePlan));
          return docs as unknown as ResponsePlan[];
        }
      } catch (err) {
        console.warn('[Repository] MongoDB getPlans error:', err);
      }
    }
    return Array.from(localStore.response_plans.values())
      .filter((p) => p.incidentId === incidentId)
      .sort((a, b) => b.version - a.version);
  },

  async getLatestPlan(incidentId: string): Promise<ResponsePlan | null> {
    const plans = await this.getPlans(incidentId);
    return plans[0] || null;
  },

  async savePlan(plan: ResponsePlan): Promise<ResponsePlan> {
    localStore.response_plans.set(plan.planId, plan);
    if (isMongoConnected()) {
      try {
        await ResponsePlanModel.findOneAndUpdate(
          { planId: plan.planId },
          { $set: plan },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB savePlan error:', err);
      }
    }
    return plan;
  },

  // --- RESOURCES ---
  async getResources(incidentId: string): Promise<EmergencyResource[]> {
    if (isMongoConnected()) {
      try {
        const docs = await EmergencyResourceModel.find({ incidentId }).lean();
        if (docs.length > 0) return docs as unknown as EmergencyResource[];
      } catch (err) {
        console.warn('[Repository] MongoDB getResources error:', err);
      }
    }
    return Array.from(localStore.resources.values()).filter((r) => r.incidentId === incidentId);
  },

  async saveResource(resource: EmergencyResource): Promise<EmergencyResource> {
    localStore.resources.set(resource.resourceId, resource);
    if (isMongoConnected()) {
      try {
        await EmergencyResourceModel.findOneAndUpdate(
          { resourceId: resource.resourceId },
          { $set: resource },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB saveResource error:', err);
      }
    }
    return resource;
  },

  // --- HUMAN ACTIONS ---
  async getHumanActions(incidentId: string): Promise<HumanAction[]> {
    if (isMongoConnected()) {
      try {
        const docs = await HumanActionModel.find({ incidentId }).sort({ timestamp: -1 }).lean();
        if (docs.length > 0) return docs as unknown as HumanAction[];
      } catch (err) {
        console.warn('[Repository] MongoDB getHumanActions error:', err);
      }
    }
    return Array.from(localStore.human_actions.values())
      .filter((h) => h.incidentId === incidentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async recordHumanAction(action: HumanAction): Promise<HumanAction> {
    localStore.human_actions.set(action.actionId, action);
    if (isMongoConnected()) {
      try {
        await HumanActionModel.findOneAndUpdate(
          { actionId: action.actionId },
          { $set: action },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB recordHumanAction error:', err);
      }
    }
    return action;
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(incidentId?: string): Promise<AuditLog[]> {
    if (isMongoConnected()) {
      try {
        const query = incidentId ? { incidentId } : {};
        const docs = await AuditLogModel.find(query).sort({ timestamp: -1 }).lean();
        if (docs.length > 0) return docs as unknown as AuditLog[];
      } catch (err) {
        console.warn('[Repository] MongoDB getAuditLogs error:', err);
      }
    }
    const logs = Array.from(localStore.audit_logs.values());
    if (incidentId) {
      return logs.filter((l) => l.incidentId === incidentId).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addAuditLog(log: AuditLog): Promise<AuditLog> {
    localStore.audit_logs.set(log.logId, log);
    if (isMongoConnected()) {
      try {
        await AuditLogModel.findOneAndUpdate(
          { logId: log.logId },
          { $set: log },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB addAuditLog error:', err);
      }
    }
    return log;
  },

  // --- MOSS CONTEXT ITEMS ---
  async saveMossItem(item: any): Promise<void> {
    if (isMongoConnected()) {
      try {
        await MossContextModel.findOneAndUpdate(
          { itemId: item.itemId },
          { $set: item },
          { upsert: true }
        );
      } catch (err) {
        console.warn('[Repository] MongoDB saveMossItem error:', err);
      }
    }
  },

  async getMossItems(incidentId: string): Promise<any[]> {
    if (isMongoConnected()) {
      try {
        return await MossContextModel.find({ incidentId }).sort({ timestamp: -1 }).lean();
      } catch (err) {
        console.warn('[Repository] MongoDB getMossItems error:', err);
      }
    }
    return [];
  }
};
