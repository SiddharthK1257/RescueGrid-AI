import { Router, Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { orchestrator } from '../agents/agentOrchestrator.js';
import { mossClient } from '../moss/mossClient.js';
import { Incident } from '../db/models.js';

export const incidentRouter = Router();

// GET all incidents
incidentRouter.get('/', async (req: Request, res: Response) => {
  try {
    const incidents = await repository.getIncidents();
    res.json({ success: true, incidents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single incident details
incidentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const incident = await repository.getIncident(incidentId);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const [updates, plan, agentStates, resources, auditLogs, contextItems] = await Promise.all([
      repository.getUpdates(incidentId),
      repository.getLatestPlan(incidentId),
      mossClient.getAgentStates(incidentId),
      repository.getResources(incidentId),
      repository.getAuditLogs(incidentId),
      mossClient.getAllContext(incidentId)
    ]);

    res.json({
      success: true,
      incident,
      updates,
      latestPlan: plan,
      agentStates,
      resources,
      auditLogs,
      contextCount: contextItems.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE incident & run initial pipeline
incidentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data: Partial<Incident> = req.body;
    const incidentId = data.incidentId || `RG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const incident: Incident = {
      incidentId,
      title: data.title || 'Untitled Emergency Incident',
      type: data.type || 'Emergency',
      location: data.location || {
        address: 'Downtown Main Corridor',
        lat: 37.7749,
        lng: -122.4194,
        zone: 'Zone 1'
      },
      description: data.description || 'Emergency incident reported. Initial assessment required.',
      severity: data.severity || 'HIGH',
      affectedPeople: data.affectedPeople || 1,
      hazards: data.hazards || ['Unconfirmed hazards on scene'],
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repository.saveIncident(incident);

    // Initial MOSS Context Item
    await mossClient.syncContextItem({
      incidentId,
      source: 'HUMAN',
      type: 'INITIAL_REPORT',
      content: incident.description,
      summary: `Initial Dispatch: ${incident.title}`,
      metadata: {
        tags: ['initial-report', incident.type.toLowerCase(), incident.severity.toLowerCase()],
        importance: 10,
        confidence: 1.0
      }
    });

    // Run the multi-agent pipeline asynchronously or await
    const initialPlan = await orchestrator.runIncidentPipeline(incidentId, false);

    res.status(201).json({
      success: true,
      incident,
      initialPlan
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// INJECT NEW INFORMATION
incidentRouter.post('/:id/inject', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const { content, author, source, verified } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Content string is required' });
    }

    const result = await orchestrator.injectNewInformation(
      incidentId,
      content,
      author || 'Human Operator',
      source || 'HUMAN',
      verified !== false
    );

    res.json({
      success: true,
      update: result.update,
      revisedPlan: result.revisedPlan
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// HUMAN OPERATOR ACTION (Approve, Reject, Reassess, Add Note)
incidentRouter.post('/:id/action', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const { action, content, targetId, user } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    await orchestrator.handleHumanAction({
      actionId: `act-${Date.now()}`,
      incidentId,
      user: user || 'Lead Commander',
      action,
      content: content || '',
      targetId,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: `Action ${action} executed successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all response plan versions
incidentRouter.get('/:id/plans', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const plans = await repository.getPlans(incidentId);
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET resources
incidentRouter.get('/:id/resources', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const resources = await repository.getResources(incidentId);
    res.json({ success: true, resources });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET audit logs
incidentRouter.get('/:id/audit', async (req: Request, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const logs = await repository.getAuditLogs(incidentId);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
