import { Router, Request, Response } from 'express';
import { orchestrator } from '../agents/agentOrchestrator.js';
import { SCENARIOS } from '../agents/scenarios.js';
import { repository } from '../db/repository.js';
import { mossClient } from '../moss/mossClient.js';
import { mossEngine } from '../moss/mossEngine.js';
import { AgentName } from '../db/models.js';

export const agentRouter = Router();

// ASK INDIVIDUAL AGENT A QUESTION
agentRouter.post('/ask', async (req: Request, res: Response) => {
  try {
    const { incidentId, agent, question } = req.body;

    if (!incidentId || !agent || !question) {
      return res.status(400).json({ success: false, error: 'incidentId, agent, and question are required' });
    }

    const answer = await orchestrator.askAgentQuestion(incidentId, agent as AgentName, question);
    res.json({ success: true, agent, question, answer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET PRESET SCENARIOS
agentRouter.get('/scenarios', (_req: Request, res: Response) => {
  res.json({ success: true, scenarios: SCENARIOS });
});

// LOAD A SCENARIO & INITIALIZE
agentRouter.post('/scenarios/load/:id', async (req: Request, res: Response) => {
  try {
    const scenarioId = req.params.id;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);

    if (!scenario) {
      return res.status(404).json({ success: false, error: `Scenario ${scenarioId} not found` });
    }

    // Reset/init context space
    mossEngine.clearContextSpace(scenario.incident.incidentId);

    // Save incident to DB
    await repository.saveIncident(scenario.incident);

    // Initial context item
    await mossClient.syncContextItem({
      incidentId: scenario.incident.incidentId,
      source: 'HUMAN',
      type: 'INITIAL_REPORT',
      content: scenario.incident.description,
      summary: `Initial Dispatch: ${scenario.incident.title}`,
      metadata: {
        tags: ['scenario', scenario.category.toLowerCase(), scenario.incident.severity.toLowerCase()],
        importance: 10,
        confidence: 1.0
      }
    });

    // Run pipeline
    const initialPlan = await orchestrator.runIncidentPipeline(scenario.incident.incidentId, false);

    res.json({
      success: true,
      message: `Scenario '${scenario.name}' loaded successfully.`,
      incident: scenario.incident,
      initialPlan,
      suggestedUpdates: scenario.suggestedUpdates
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
