import { AgentName, AgentStateStatus } from '../db/models.js';

export type MossSource = 'HUMAN' | 'COMMANDER' | 'MEDICAL' | 'RESCUE' | 'TRAFFIC' | 'RESOURCE' | 'COMMUNICATION' | 'SITUATION' | 'SYSTEM';
export type MossContextType =
  | 'INITIAL_REPORT'
  | 'HUMAN_UPDATE'
  | 'AGENT_ASSESSMENT'
  | 'COMMANDER_DECISION'
  | 'ENVIRONMENTAL_UPDATE'
  | 'REVISED_PLAN'
  | 'VERIFIED_FACT'
  | 'CONFLICT_RESOLUTION';

export interface MossContextItem {
  id: string;
  incidentId: string;
  source: MossSource;
  type: MossContextType;
  content: string;
  summary: string;
  metadata: {
    tags: string[];
    confidence?: number;
    agent?: AgentName;
    importance: number; // 1 - 10
    relevanceScore?: number; // Calculated dynamically on retrieval
    vector?: number[];
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

export interface MossRetrievalOptions {
  query: string;
  agentRole?: AgentName;
  topK?: number;
  minRelevance?: number;
  types?: MossContextType[];
}

/**
 * High-precision domain tokenizer for Emergency Response semantics
 */
const DOMAIN_WEIGHTS: Record<string, string[]> = {
  TRAFFIC: ['road', 'highway', 'lane', 'blocked', 'access', 'traffic', 'route', 'detour', 'congestion', 'exit', 'closure', 'flooding', 'bridge'],
  MEDICAL: ['injured', 'injury', 'critical', 'urgent', 'casualty', 'triage', 'unconscious', 'bleeding', 'hospital', 'trauma', 'burn', 'victim'],
  RESCUE: ['trapped', 'entrapment', 'vehicle', 'smoke', 'fire', 'flames', 'structural', 'collapse', 'debris', 'hazard', 'extraction', 'hazard'],
  RESOURCE: ['ambulance', 'fire engine', 'engine', 'squad', 'police', 'medic', 'equipment', 'heavy rescue', 'dispatch', 'unit', 'personnel'],
  COMMUNICATION: ['public', 'alert', 'broadcast', 'briefing', 'warning', 'evacuation', 'press', 'advisory', 'dispatch'],
  COMMANDER: ['priority', 'plan', 'strategy', 'decision', 'conflict', 'overview', 'incident', 'command', 'status', 'resolution']
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function computeTermFrequency(words: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const w of words) {
    tf.set(w, (tf.get(w) || 0) + 1);
  }
  return tf;
}

export class MossSharedContextEngine {
  // Context spaces indexed by incidentId (e.g. 'rg-incident-RG-2026-0001')
  private contextSpaces: Map<string, MossContextItem[]> = new Map();
  // Shared agent states indexed by `incidentId:agent`
  private agentStates: Map<string, MossAgentState> = new Map();

  constructor() {
    console.log('[MOSS] Initialized MOSS Shared Context & Multi-Agent State Engine');
  }

  /**
   * Ensure an isolated context space exists for an incident
   */
  public ensureContextSpace(incidentId: string): MossContextItem[] {
    if (!this.contextSpaces.has(incidentId)) {
      this.contextSpaces.set(incidentId, []);
      console.log(`[MOSS] Created isolated context space for incident: ${incidentId}`);
    }
    return this.contextSpaces.get(incidentId)!;
  }

  /**
   * Add an item to the MOSS shared context
   */
  public addContextItem(item: Omit<MossContextItem, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): MossContextItem {
    const space = this.ensureContextSpace(item.incidentId);
    const fullItem: MossContextItem = {
      id: item.id || `moss-ctx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: item.timestamp || new Date().toISOString(),
      ...item
    };

    space.push(fullItem);
    console.log(`[MOSS] Context stored [${fullItem.source}] (${fullItem.type}): "${fullItem.summary}" in ${item.incidentId}`);
    return fullItem;
  }

  /**
   * Retrieve all context items for an incident chronologically
   */
  public getAllContext(incidentId: string): MossContextItem[] {
    const space = this.contextSpaces.get(incidentId) || [];
    return [...space].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * SEMANTIC RETRIEVAL:
   * Dynamically retrieves relevant historical context items for an agent/query
   * without flooding the agent with irrelevant noise.
   */
  public retrieveRelevantContext(options: MossRetrievalOptions & { incidentId: string }): MossContextItem[] {
    const items = this.getAllContext(options.incidentId);
    if (items.length === 0) return [];

    const queryWords = tokenize(options.query);
    const queryTf = computeTermFrequency(queryWords);
    const roleKeywords = options.agentRole ? DOMAIN_WEIGHTS[options.agentRole] || [] : [];

    const scored = items.map((item) => {
      const contentWords = tokenize(`${item.content} ${item.summary} ${item.metadata.tags.join(' ')}`);
      const itemTf = computeTermFrequency(contentWords);

      // 1. Term Overlap / Cosine-like scoring
      let matchScore = 0;
      for (const [qWord, qCount] of queryTf.entries()) {
        const iCount = itemTf.get(qWord) || 0;
        if (iCount > 0) {
          matchScore += (qCount * iCount) / Math.sqrt(contentWords.length + 1);
        }
      }

      // 2. Domain Role Affinity Boost
      let roleBoost = 0;
      for (const rKey of roleKeywords) {
        if (itemTf.has(rKey)) {
          roleBoost += 0.15;
        }
      }

      // 3. Source Affinity (e.g. if item was created by the same agent or human update)
      let sourceBoost = 0;
      if (options.agentRole && item.source === options.agentRole) {
        sourceBoost = 0.2;
      } else if (item.source === 'HUMAN') {
        sourceBoost = 0.25; // Human updates are always highly relevant
      }

      // 4. Recency calculation (decay over hours, but keep recent updates prioritized)
      const ageHours = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.max(0.7, 1 - ageHours * 0.05);

      // 5. Verified facts / importance
      const importanceBoost = (item.metadata.importance || 5) / 20; // 0.05 - 0.5

      // Final normalized relevance score between 0.1 and 0.99
      const rawScore = (matchScore * 1.5 + roleBoost + sourceBoost + importanceBoost) * recencyFactor;
      const normalizedScore = Math.min(0.99, Math.max(0.12, parseFloat((rawScore / (1 + rawScore)).toFixed(2))));

      return {
        ...item,
        metadata: {
          ...item.metadata,
          relevanceScore: normalizedScore
        }
      };
    });

    // Filter by minRelevance if specified
    const minRel = options.minRelevance || 0.15;
    let filtered = scored.filter((s) => (s.metadata.relevanceScore || 0) >= minRel);

    // If types requested
    if (options.types && options.types.length > 0) {
      filtered = filtered.filter((s) => options.types!.includes(s.type));
    }

    // Sort descending by relevance score
    filtered.sort((a, b) => (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0));

    const topK = options.topK || 5;
    const finalResults = filtered.slice(0, topK);

    console.log(
      `[MOSS Semantic Retrieval] Agent: ${options.agentRole || 'ALL'} | Query: "${options.query.substring(0, 40)}..." | Matches: ${finalResults.length}/${items.length}`
    );

    return finalResults;
  }

  /**
   * MULTI-AGENT STATE MANAGEMENT
   */
  public setAgentState(incidentId: string, agent: AgentName, update: Partial<MossAgentState>): MossAgentState {
    const key = `${incidentId}:${agent}`;
    const existing: MossAgentState = this.agentStates.get(key) || {
      incidentId,
      agent,
      status: 'IDLE',
      currentTask: 'Awaiting task delegation',
      contextRetrieved: 0,
      lastUpdated: new Date().toISOString()
    };

    const newState: MossAgentState = {
      ...existing,
      ...update,
      lastUpdated: new Date().toISOString()
    };

    this.agentStates.set(key, newState);
    return newState;
  }

  public getAgentState(incidentId: string, agent: AgentName): MossAgentState {
    const key = `${incidentId}:${agent}`;
    return (
      this.agentStates.get(key) || {
        incidentId,
        agent,
        status: 'IDLE',
        currentTask: 'Awaiting task delegation',
        contextRetrieved: 0,
        lastUpdated: new Date().toISOString()
      }
    );
  }

  public getAllAgentStates(incidentId: string): MossAgentState[] {
    const agents: AgentName[] = ['COMMANDER', 'MEDICAL', 'RESCUE', 'TRAFFIC', 'RESOURCE', 'COMMUNICATION', 'SITUATION'];
    return agents.map((a) => this.getAgentState(incidentId, a));
  }

  /**
   * Session export for long-running task persistence and replay
   */
  public exportSession(incidentId: string) {
    return {
      incidentId,
      contextItems: this.getAllContext(incidentId),
      agentStates: this.getAllAgentStates(incidentId),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Session import for reopening past incidents
   */
  public importSession(session: { incidentId: string; contextItems: MossContextItem[]; agentStates: MossAgentState[] }) {
    this.contextSpaces.set(session.incidentId, session.contextItems);
    for (const state of session.agentStates) {
      this.agentStates.set(`${session.incidentId}:${state.agent}`, state);
    }
  }

  public clearContextSpace(incidentId: string) {
    this.contextSpaces.delete(incidentId);
    const agents: AgentName[] = ['COMMANDER', 'MEDICAL', 'RESCUE', 'TRAFFIC', 'RESOURCE', 'COMMUNICATION', 'SITUATION'];
    for (const a of agents) {
      this.agentStates.delete(`${incidentId}:${a}`);
    }
  }
}

export const mossEngine = new MossSharedContextEngine();
