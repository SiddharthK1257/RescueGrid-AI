import {
  Incident, IncidentUpdate, ResponsePlan, AgentResult, MossContextItem,
  MapMarker, LocationRecord, AuditLog, LiveKitTokenResponse, SystemHealth,
  AuthUser
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rescuegrid_jwt_token');
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rescuegrid_jwt_token', token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('rescuegrid_jwt_token');
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error || errData?.detail || `API Error ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[RescueGrid API] Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  getSeedUsers: () =>
    fetchJson<{ success: boolean; users: Array<AuthUser & { password: string }> }>('/api/auth/seed-users'),

  login: async (email: string, password: string) => {
    const data = await fetchJson<{ success: boolean; token?: string; user?: AuthUser; message?: string; error?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    badgeNumber?: string;
  }) => {
    const data = await fetchJson<{ success: boolean; token?: string; user?: AuthUser; message?: string; error?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.success && data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await fetchJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    } finally {
      removeStoredToken();
    }
    return { success: true };
  },

  getMe: () => fetchJson<{ success: boolean; user?: AuthUser; error?: string }>('/api/auth/me'),

  // Health
  getHealth: () => fetchJson<SystemHealth>('/api/health'),

  // Incidents
  getIncidents: () => fetchJson<Incident[]>('/api/incidents'),
  getIncident: (id: string) => fetchJson<Incident>(`/api/incidents/${id}`),
  createIncident: (incident: Partial<Incident>) =>
    fetchJson<Incident>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    }),
  updateIncident: (id: string, updates: Partial<Incident>) =>
    fetchJson<Incident>(`/api/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Updates & Reassessment
  addUpdate: (id: string, content: string, source: string = 'HUMAN_OPERATOR', verificationStatus: string = 'VERIFIED') =>
    fetchJson<IncidentUpdate>(`/api/incidents/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify({ content, source, verificationStatus }),
    }),
  triggerAnalysis: (id: string) =>
    fetchJson<any>(`/api/incidents/${id}/analyze`, { method: 'POST' }),
  triggerReassessment: (id: string, reason: string) =>
    fetchJson<any>(`/api/incidents/${id}/reassess`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Agent Results & Moss Context
  getAgentResults: (id: string) => fetchJson<AgentResult[]>(`/api/incidents/${id}/agents`),
  getMossContext: (id: string) => fetchJson<MossContextItem[]>(`/api/incidents/${id}/context`),
  getTimeline: (id: string) => fetchJson<AuditLog[]>(`/api/incidents/${id}/timeline`),

  // Response Plan
  getResponsePlan: (id: string) =>
    fetchJson<{ latestPlan: ResponsePlan | null; history: ResponsePlan[] }>(`/api/incidents/${id}/response-plan`),
  approvePlan: (id: string, approved: boolean, notes?: string, operatorId: string = 'Operator_1') =>
    fetchJson<ResponsePlan>(`/api/incidents/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved, notes, operatorId }),
    }),

  // LiveKit Collaboration
  getLiveKitToken: (id: string, participantName: string) =>
    fetchJson<LiveKitTokenResponse>(`/api/incidents/${id}/livekit-token`, {
      method: 'POST',
      body: JSON.stringify({
        roomName: `incident-${id.toLowerCase()}`,
        participantName,
      }),
    }),
  getCollaborationStatus: (id: string) =>
    fetchJson<any>(`/api/incidents/${id}/collaboration-status`),

  // Map and Location
  getMapData: (id: string) =>
    fetchJson<{ incident: Incident; markers: MapMarker[]; locations: LocationRecord[] }>(`/api/incidents/${id}/map-data`),
  recordLocation: (id: string, loc: Partial<LocationRecord>) =>
    fetchJson<LocationRecord>(`/api/incidents/${id}/location`, {
      method: 'POST',
      body: JSON.stringify(loc),
    }),

  // Simulation
  startSimulation: () => fetchJson<any>('/api/simulation/start', { method: 'POST' }),
  injectSimulationUpdate: (id: string, content: string) =>
    fetchJson<any>(`/api/simulation/${id}/inject-update`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        source: 'SIMULATED',
        verificationStatus: 'SIMULATED',
        isSimulated: true,
      }),
    }),
};
