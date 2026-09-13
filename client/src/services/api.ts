import {
  Incident,
  IncidentUpdate,
  ResponsePlan,
  MossContextItem,
  MossAgentState,
  EmergencyResource,
  AuditLog,
  SettingsStatus,
  AuthUser
} from '../types';

const BASE_URL = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('rescuegrid_jwt_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('rescuegrid_jwt_token', token);
}

export function removeStoredToken() {
  localStorage.removeItem('rescuegrid_jwt_token');
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export const api = {
  // --- AUTHENTICATION (JWT) ---
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser; message?: string; error?: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    badgeNumber?: string;
  }): Promise<{ success: boolean; token: string; user: AuthUser; message?: string; error?: string }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      await fetchWithAuth(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } finally {
      removeStoredToken();
    }
    return { success: true };
  },

  async getMe(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const res = await fetchWithAuth(`${BASE_URL}/auth/me`);
    return res.json();
  },

  async getSeedUsers(): Promise<{ success: boolean; users: Array<AuthUser & { password: string }> }> {
    const res = await fetch(`${BASE_URL}/auth/seed-users`);
    return res.json();
  },

  // --- INCIDENTS ---
  async getIncidents(): Promise<Incident[]> {
    const res = await fetchWithAuth(`${BASE_URL}/incidents`);
    const data = await res.json();
    return data.incidents || [];
  },

  async getIncidentDetails(incidentId: string): Promise<{
    incident: Incident;
    updates: IncidentUpdate[];
    latestPlan: ResponsePlan | null;
    agentStates: MossAgentState[];
    resources: EmergencyResource[];
    auditLogs: AuditLog[];
    contextCount: number;
  }> {
    const res = await fetchWithAuth(`${BASE_URL}/incidents/${incidentId}`);
    return res.json();
  },

  async createIncident(payload: Partial<Incident>): Promise<{ incident: Incident; initialPlan: ResponsePlan }> {
    const res = await fetchWithAuth(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async injectUpdate(
    incidentId: string,
    content: string,
    author = 'Human Operator',
    verified = true
  ): Promise<{ update: IncidentUpdate; revisedPlan: ResponsePlan }> {
    const res = await fetchWithAuth(`${BASE_URL}/incidents/${incidentId}/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author, verified })
    });
    return res.json();
  },

  async handleAction(
    incidentId: string,
    action: string,
    targetId?: string,
    content?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${BASE_URL}/incidents/${incidentId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetId, content })
    });
    return res.json();
  },

  async getPlans(incidentId: string): Promise<ResponsePlan[]> {
    const res = await fetchWithAuth(`${BASE_URL}/incidents/${incidentId}/plans`);
    const data = await res.json();
    return data.plans || [];
  },

  // --- MOSS ---
  async getMossContext(incidentId: string): Promise<MossContextItem[]> {
    const res = await fetchWithAuth(`${BASE_URL}/moss/context/${incidentId}`);
    const data = await res.json();
    return data.items || [];
  },

  async searchMoss(
    incidentId: string,
    query: string,
    agentRole?: string
  ): Promise<MossContextItem[]> {
    const res = await fetchWithAuth(`${BASE_URL}/moss/search/${incidentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, agentRole })
    });
    const data = await res.json();
    return data.items || [];
  },

  async getAgentStates(incidentId: string): Promise<MossAgentState[]> {
    const res = await fetchWithAuth(`${BASE_URL}/moss/states/${incidentId}`);
    const data = await res.json();
    return data.states || [];
  },

  // --- AGENT QUESTIONS ---
  async askAgent(incidentId: string, agent: string, question: string): Promise<{ answer: string }> {
    const res = await fetchWithAuth(`${BASE_URL}/agents/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId, agent, question })
    });
    return res.json();
  },

  // --- SCENARIOS ---
  async getScenarios(): Promise<any[]> {
    const res = await fetchWithAuth(`${BASE_URL}/agents/scenarios`);
    const data = await res.json();
    return data.scenarios || [];
  },

  async loadScenario(scenarioId: string): Promise<any> {
    const res = await fetchWithAuth(`${BASE_URL}/agents/scenarios/load/${scenarioId}`, {
      method: 'POST'
    });
    return res.json();
  },

  // --- SETTINGS ---
  async getSettings(): Promise<SettingsStatus> {
    const res = await fetchWithAuth(`${BASE_URL}/settings`);
    return res.json();
  },

  async updateSettings(payload: any): Promise<any> {
    const res = await fetchWithAuth(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
