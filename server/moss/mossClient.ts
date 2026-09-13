import { config } from '../config.js';
import { mossEngine, MossContextItem, MossRetrievalOptions, MossAgentState } from './mossEngine.js';
import { AgentName } from '../db/models.js';

export class MossClient {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = config.mossApiKey;
    this.endpoint = config.mossEndpoint;
  }

  public isExternalConfigured(): boolean {
    return Boolean(config.mossApiKey && config.mossEndpoint && !config.mossEndpoint.includes('localhost'));
  }

  public async syncContextItem(item: Omit<MossContextItem, 'id' | 'timestamp'>): Promise<MossContextItem> {
    // Always store in local high-speed MOSS context engine
    const stored = mossEngine.addContextItem(item);

    // If external MOSS endpoint is configured, forward context item asynchronously
    if (this.isExternalConfigured()) {
      try {
        await fetch(`${config.mossEndpoint}/v1/context`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.mossApiKey}`
          },
          body: JSON.stringify(stored)
        });
      } catch (err: any) {
        console.warn(`[MOSS Client] Remote sync skipped (${err.message}). Local context preserved.`);
      }
    }

    return stored;
  }

  public async retrieveSemanticContext(options: MossRetrievalOptions & { incidentId: string }): Promise<MossContextItem[]> {
    if (this.isExternalConfigured()) {
      try {
        const res = await fetch(`${config.mossEndpoint}/v1/context/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.mossApiKey}`
          },
          body: JSON.stringify(options)
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) return data.items;
        }
      } catch (err: any) {
        console.warn(`[MOSS Client] Remote retrieval failed (${err.message}). Using local semantic engine.`);
      }
    }

    return mossEngine.retrieveRelevantContext(options);
  }

  public updateAgentState(incidentId: string, agent: AgentName, update: Partial<MossAgentState>): MossAgentState {
    return mossEngine.setAgentState(incidentId, agent, update);
  }

  public getAgentStates(incidentId: string): MossAgentState[] {
    return mossEngine.getAllAgentStates(incidentId);
  }

  public getAllContext(incidentId: string): MossContextItem[] {
    return mossEngine.getAllContext(incidentId);
  }
}

export const mossClient = new MossClient();
