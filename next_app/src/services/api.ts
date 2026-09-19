import {
  Incident, IncidentUpdate, ResponsePlan, AgentResult, MossContextItem,
  MapMarker, LocationRecord, AuditLog, LiveKitTokenResponse, SystemHealth,
  AuthUser
} from '../types';

const isDev = process.env.NODE_ENV === 'development';
export const PRODUCTION_BACKEND_URL = 'https://rescuegrid-ai-lmyh.onrender.com';

/**
 * Returns the active FastAPI backend URL.
 * Automatically adapts:
 * - If NEXT_PUBLIC_API_URL is set, uses that.
 * - In local browser (localhost or 127.0.0.1), uses http://localhost:8000.
 * - On production web domains (e.g. Vercel), uses PRODUCTION_BACKEND_URL (Render).
 */
export function getActiveBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return PRODUCTION_BACKEND_URL;
  }
  return isDev ? 'http://localhost:8000' : PRODUCTION_BACKEND_URL;
}

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

/**
 * Resilient JSON fetcher:
 * 1. Calls primary endpoint (direct to backend or configured URL).
 * 2. If primary fails with network error or 5xx/504 gateway timeout (e.g. while Render is waking up),
 *    automatically attempts fallback via the relative Next.js proxy (/api/...).
 * 3. Injects JWT Bearer token if present.
 */
async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const primaryBase = getActiveBackendUrl();
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const primaryUrl = `${primaryBase}${endpoint}`;
  const fallbackUrl = endpoint; // Relative path proxied by Next.js rewrites on Vercel

  let lastError: any = null;

  // Primary Attempt: Direct connection to backend
  try {
    const res = await fetch(primaryUrl, {
      ...options,
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    const errMsg = errData?.error || errData?.detail || `API Error ${res.status}: ${res.statusText}`;
    lastError = new Error(errMsg);

    // If client error (400, 401, 403, 422), do not retry fallback
    if (res.status >= 400 && res.status < 500 && res.status !== 404) {
      throw lastError;
    }
  } catch (err: any) {
    lastError = err;
  }

  // Fallback Attempt: If primary failed and fallback is distinct
  if (primaryUrl !== fallbackUrl && typeof window !== 'undefined') {
    try {
      const res = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error || errData?.detail || `Fallback Error ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    } catch (fallbackErr) {
      console.warn(`[RescueGrid API] Both primary (${primaryUrl}) and fallback (${fallbackUrl}) failed for ${endpoint}:`, {
        primary: lastError?.message || lastError,
        fallback: (fallbackErr as any)?.message || fallbackErr,
      });
    }
  }

  throw lastError || new Error(`Failed to fetch ${endpoint}`);
}

export const api = {
  getBaseUrl: getActiveBackendUrl,
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
