import { Router, Request, Response } from 'express';
import { mossClient } from '../moss/mossClient.js';
import { mossEngine, MossContextType } from '../moss/mossEngine.js';
import { AgentName } from '../db/models.js';

export const mossRouter = Router();

// GET all context items in MOSS for an incident
mossRouter.get('/context/:incidentId', (req: Request, res: Response) => {
  try {
    const incidentId = req.params.incidentId as string;
    const items = mossClient.getAllContext(incidentId);
    res.json({
      success: true,
      incidentId,
      count: items.length,
      items
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SEMANTIC SEARCH across MOSS shared context
mossRouter.post('/search/:incidentId', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.incidentId as string;
    const { query, agentRole, topK, minRelevance, types } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const items = await mossClient.retrieveSemanticContext({
      incidentId,
      query,
      agentRole: agentRole as AgentName,
      topK: topK ? parseInt(topK, 10) : 5,
      minRelevance: minRelevance ? parseFloat(minRelevance) : 0.1,
      types: types as MossContextType[]
    });

    res.json({
      success: true,
      incidentId,
      query,
      agentRole: agentRole || 'ALL',
      matchCount: items.length,
      items
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all agent states in MOSS for an incident
mossRouter.get('/states/:incidentId', (req: Request, res: Response) => {
  try {
    const incidentId = req.params.incidentId as string;
    const states = mossClient.getAgentStates(incidentId);
    res.json({ success: true, incidentId, states });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADD context item to MOSS
mossRouter.post('/context/:incidentId', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.incidentId as string;
    const { source, type, content, summary, tags, importance } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const item = await mossClient.syncContextItem({
      incidentId,
      source: source || 'HUMAN',
      type: type || 'HUMAN_UPDATE',
      content,
      summary: summary || content.substring(0, 60),
      metadata: {
        tags: tags || ['manual-entry'],
        importance: importance || 5
      }
    });

    res.status(201).json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// EXPORT SESSION for long-running memory
mossRouter.get('/session/:incidentId', (req: Request, res: Response) => {
  try {
    const incidentId = req.params.incidentId as string;
    const session = mossEngine.exportSession(incidentId);
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// IMPORT SESSION
mossRouter.post('/session/import', (req: Request, res: Response) => {
  try {
    const { session } = req.body;
    if (!session || !session.incidentId) {
      return res.status(400).json({ success: false, error: 'Valid session payload required' });
    }
    mossEngine.importSession(session);
    res.json({ success: true, message: `Session for ${session.incidentId} imported successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
