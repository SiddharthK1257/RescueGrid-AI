import { repository } from '../db/repository.js';
import { mossClient } from '../moss/mossClient.js';
import { mossEngine, MossContextItem } from '../moss/mossEngine.js';
import { geminiService } from './geminiService.js';
import {
  AgentName,
  Incident,
  IncidentUpdate,
  ResponsePlan,
  EmergencyResource,
  AuditLog,
  HumanAction
} from '../db/models.js';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function broadcast(event: string, payload: any) {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
}

export function emitActivity(incidentId: string, agent: string, message: string, type: 'info' | 'moss' | 'agent' | 'commander' | 'alert' = 'info') {
  const activity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    incidentId,
    agent,
    message,
    type,
    timestamp: new Date().toISOString()
  };
  broadcast('live_activity', activity);
  return activity;
}

export class AgentOrchestrator {
  /**
   * Primary Collaborative Pipeline:
   * HUMAN -> INCIDENT -> MOSS SHARED CONTEXT -> COMMANDER -> MULTIPLE SPECIALIZED AGENTS (PARALLEL)
   * -> MOSS STATE & SHARED CONTEXT -> COMMANDER SYNTHESIS & CONFLICT RESOLUTION -> RESPONSE PLAN -> HUMAN REVIEW
   */
  public async runIncidentPipeline(
    incidentId: string,
    isReassessment: boolean = false,
    triggerContext?: string
  ): Promise<ResponsePlan> {
    const incident = await repository.getIncident(incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found.`);

    console.log(`[Orchestrator] Starting ${isReassessment ? 'REASSESSMENT' : 'INITIAL'} pipeline for ${incidentId}`);
    emitActivity(incidentId, 'COMMANDER', `${isReassessment ? 'Reassessing incident pipeline due to new update' : 'Initiating multi-agent response pipeline'}`, 'commander');

    // 1. Commander acknowledges and queries MOSS
    mossClient.updateAgentState(incidentId, 'COMMANDER', {
      status: 'ASSIGNING',
      currentTask: isReassessment ? 'Evaluating new context and delegating reassessment' : 'Retrieving shared context and delegating sector tasks'
    });
    broadcast('agent_states_updated', { incidentId, states: mossClient.getAgentStates(incidentId) });

    emitActivity(incidentId, 'MOSS', 'Querying shared memory space and active incident timeline', 'moss');

    // 2. Retrieve previous response plan if exists
    const previousPlan = await repository.getLatestPlan(incidentId);

    // 3. Commander delegates tasks to specialized agents (in parallel)
    const specializedAgents: AgentName[] = ['MEDICAL', 'RESCUE', 'TRAFFIC', 'RESOURCE', 'COMMUNICATION'];
    for (const a of specializedAgents) {
      mossClient.updateAgentState(incidentId, a, {
        status: isReassessment ? 'REASSESSING' : 'ANALYZING',
        currentTask: `Analyzing sector conditions with MOSS semantic context`
      });
    }
    broadcast('agent_states_updated', { incidentId, states: mossClient.getAgentStates(incidentId) });

    emitActivity(incidentId, 'COMMANDER', `Delegated parallel analysis to: Medical, Rescue, Traffic, Resource, Communication`, 'commander');

    // 4. Parallel specialized agent execution using MOSS SEMANTIC RETRIEVAL
    const [medicalResult, rescueResult, trafficResult, resourceResult, commsResult, situationResult] = await Promise.all([
      // MEDICAL AGENT
      (async () => {
        emitActivity(incidentId, 'MEDICAL', 'Retrieving injury & casualty context from MOSS', 'agent');
        const retrieved = await mossClient.retrieveSemanticContext({
          incidentId,
          query: 'casualties injuries trauma triage critical unconscious bleeding patients',
          agentRole: 'MEDICAL',
          topK: 6
        });
        mossClient.updateAgentState(incidentId, 'MEDICAL', { contextRetrieved: retrieved.length });

        emitActivity(incidentId, 'MEDICAL', `Synthesizing triage with ${retrieved.length} MOSS context items`, 'agent');
        const analysis = await geminiService.analyzeMedical(incident.title, retrieved);

        await repository.saveResult({
          resultId: `res-med-${Date.now()}`,
          incidentId,
          agent: 'MEDICAL',
          result: analysis,
          confidence: analysis.confidence,
          contextItemsUsed: retrieved.map((r) => r.id),
          timestamp: new Date().toISOString()
        });

        // Store result into MOSS shared context
        await mossClient.syncContextItem({
          incidentId,
          source: 'MEDICAL',
          type: 'AGENT_ASSESSMENT',
          content: `${analysis.triageSummary}. Actions: ${analysis.recommendedMedicalActions.join('; ')}`,
          summary: `Medical Triage: ${analysis.urgencyLevel} (${analysis.criticalCasualties} critical, ${analysis.urgentCasualties} urgent)`,
          metadata: {
            tags: ['medical', 'triage', analysis.urgencyLevel.toLowerCase()],
            confidence: analysis.confidence,
            agent: 'MEDICAL',
            importance: 9
          }
        });

        mossClient.updateAgentState(incidentId, 'MEDICAL', {
          status: 'COMPLETE',
          currentTask: 'Medical sector triage complete'
        });
        return analysis;
      })(),

      // RESCUE AGENT
      (async () => {
        emitActivity(incidentId, 'RESCUE', 'Retrieving physical hazard & entrapment context from MOSS', 'agent');
        const retrieved = await mossClient.retrieveSemanticContext({
          incidentId,
          query: 'vehicle entrapment fire smoke structural damage hazards physical extrication',
          agentRole: 'RESCUE',
          topK: 6
        });
        mossClient.updateAgentState(incidentId, 'RESCUE', { contextRetrieved: retrieved.length });

        emitActivity(incidentId, 'RESCUE', `Assessing hazard containment with ${retrieved.length} MOSS context items`, 'agent');
        const analysis = await geminiService.analyzeRescue(incident.title, retrieved);

        await repository.saveResult({
          resultId: `res-resc-${Date.now()}`,
          incidentId,
          agent: 'RESCUE',
          result: analysis,
          confidence: analysis.confidence,
          contextItemsUsed: retrieved.map((r) => r.id),
          timestamp: new Date().toISOString()
        });

        await mossClient.syncContextItem({
          incidentId,
          source: 'RESCUE',
          type: 'AGENT_ASSESSMENT',
          content: `Hazards: ${analysis.hazards.join(', ')}. Priorities: ${analysis.rescuePriorities.join(', ')}`,
          summary: `Rescue Hazards: ${analysis.hazards.length} identified (${analysis.hazards[0] || 'Clear'})`,
          metadata: {
            tags: ['rescue', 'hazards', 'extrication'],
            confidence: analysis.confidence,
            agent: 'RESCUE',
            importance: 9
          }
        });

        mossClient.updateAgentState(incidentId, 'RESCUE', {
          status: 'COMPLETE',
          currentTask: 'Rescue & hazard assessment complete'
        });
        return analysis;
      })(),

      // TRAFFIC & ROUTE AGENT
      (async () => {
        emitActivity(incidentId, 'TRAFFIC', 'Retrieving road network & corridor blockage context from MOSS', 'agent');
        const retrieved = await mossClient.retrieveSemanticContext({
          incidentId,
          query: 'road highway blockage lanes access alternate route detour traffic police',
          agentRole: 'TRAFFIC',
          topK: 6
        });
        mossClient.updateAgentState(incidentId, 'TRAFFIC', { contextRetrieved: retrieved.length });

        emitActivity(incidentId, 'TRAFFIC', `Computing routing constraints with ${retrieved.length} MOSS context items`, 'agent');
        const analysis = await geminiService.analyzeTraffic(incident.title, retrieved);

        await repository.saveResult({
          resultId: `res-traf-${Date.now()}`,
          incidentId,
          agent: 'TRAFFIC',
          result: analysis,
          confidence: analysis.confidence,
          contextItemsUsed: retrieved.map((r) => r.id),
          timestamp: new Date().toISOString()
        });

        await mossClient.syncContextItem({
          incidentId,
          source: 'TRAFFIC',
          type: 'AGENT_ASSESSMENT',
          content: `Primary route blocked: ${analysis.primaryAccessBlocked}. ${analysis.blockageReason}. Alternate routes: ${analysis.alternateRoutes.map((r) => r.routeName).join(', ')}`,
          summary: `Traffic: ${analysis.primaryAccessBlocked ? 'PRIMARY BLOCKED' : 'Open'} - Detour via ${analysis.alternateRoutes[0]?.routeName || 'standard'}`,
          metadata: {
            tags: ['traffic', 'route', analysis.primaryAccessBlocked ? 'blocked' : 'clear'],
            confidence: analysis.confidence,
            agent: 'TRAFFIC',
            importance: 8
          }
        });

        mossClient.updateAgentState(incidentId, 'TRAFFIC', {
          status: 'COMPLETE',
          currentTask: 'Route & access analysis complete'
        });
        return analysis;
      })(),

      // RESOURCE AGENT
      (async () => {
        emitActivity(incidentId, 'RESOURCE', 'Retrieving apparatus requirements from MOSS', 'agent');
        const retrieved = await mossClient.retrieveSemanticContext({
          incidentId,
          query: 'resources ambulance fire engine squad police dispatch personnel equipment',
          agentRole: 'RESOURCE',
          topK: 6
        });
        mossClient.updateAgentState(incidentId, 'RESOURCE', { contextRetrieved: retrieved.length });

        emitActivity(incidentId, 'RESOURCE', `Calculating unit demand with ${retrieved.length} MOSS context items`, 'agent');
        const analysis = await geminiService.analyzeResource(incident.title, retrieved);

        await repository.saveResult({
          resultId: `res-reso-${Date.now()}`,
          incidentId,
          agent: 'RESOURCE',
          result: analysis,
          confidence: analysis.confidence,
          contextItemsUsed: retrieved.map((r) => r.id),
          timestamp: new Date().toISOString()
        });

        await mossClient.syncContextItem({
          incidentId,
          source: 'RESOURCE',
          type: 'AGENT_ASSESSMENT',
          content: `Required: ${analysis.requiredResources.map((r) => `${r.quantity}x ${r.resource} (${r.priority})`).join(', ')}`,
          summary: `Resources: ${analysis.requiredResources.length} apparatus types recommended`,
          metadata: {
            tags: ['resource', 'apparatus', 'dispatch'],
            confidence: analysis.confidence,
            agent: 'RESOURCE',
            importance: 8
          }
        });

        // Sync individual resources into repository
        for (const req of analysis.requiredResources) {
          const resId = `res-${incidentId}-${req.resource.replace(/\s+/g, '_').toLowerCase()}`;
          await repository.saveResource({
            resourceId: resId,
            incidentId,
            name: `${req.quantity}x ${req.resource}`,
            type: req.resource,
            quantity: req.quantity,
            priority: req.priority,
            status: req.status,
            reason: req.reason,
            etaMinutes: req.priority === 'CRITICAL' ? 6 : 12,
            dispatchedAt: new Date().toISOString()
          });
        }

        mossClient.updateAgentState(incidentId, 'RESOURCE', {
          status: 'COMPLETE',
          currentTask: 'Resource calculation complete'
        });
        return analysis;
      })(),

      // COMMUNICATION AGENT
      (async () => {
        emitActivity(incidentId, 'COMMUNICATION', 'Retrieving briefing requirements from MOSS', 'agent');
        const retrieved = await mossClient.retrieveSemanticContext({
          incidentId,
          query: 'briefing public alert broadcast communication responder summary',
          agentRole: 'COMMUNICATION',
          topK: 5
        });
        mossClient.updateAgentState(incidentId, 'COMMUNICATION', { contextRetrieved: retrieved.length });

        const analysis = await geminiService.analyzeCommunication(incident.title, retrieved);

        await repository.saveResult({
          resultId: `res-comm-${Date.now()}`,
          incidentId,
          agent: 'COMMUNICATION',
          result: analysis,
          confidence: analysis.confidence,
          contextItemsUsed: retrieved.map((r) => r.id),
          timestamp: new Date().toISOString()
        });

        await mossClient.syncContextItem({
          incidentId,
          source: 'COMMUNICATION',
          type: 'AGENT_ASSESSMENT',
          content: analysis.responderBriefing,
          summary: `Public Alert & Briefing Drafted`,
          metadata: {
            tags: ['communication', 'alert', 'briefing'],
            confidence: analysis.confidence,
            agent: 'COMMUNICATION',
            importance: 7
          }
        });

        mossClient.updateAgentState(incidentId, 'COMMUNICATION', {
          status: 'COMPLETE',
          currentTask: 'Operational briefing drafted'
        });
        return analysis;
      })(),

      // SITUATION AGENT
      (async () => {
        const retrieved = await mossClient.retrieveSemanticContext({
          incidentId,
          query: 'overall status severity hazards situation road weather command',
          agentRole: 'SITUATION',
          topK: 6
        });
        mossClient.updateAgentState(incidentId, 'SITUATION', { contextRetrieved: retrieved.length });

        const analysis = await geminiService.analyzeSituation(incident.title, retrieved);

        // Update incident status in repository
        incident.status = analysis.incidentStatus;
        incident.severity = analysis.severity;
        await repository.saveIncident(incident);

        mossClient.updateAgentState(incidentId, 'SITUATION', {
          status: 'COMPLETE',
          currentTask: `Incident Status: ${analysis.incidentStatus} (${analysis.severity})`
        });
        return analysis;
      })()
    ]);

    broadcast('agent_states_updated', { incidentId, states: mossClient.getAgentStates(incidentId) });
    emitActivity(incidentId, 'MOSS', 'All specialized agent assessments stored into shared context', 'moss');

    // 5. COMMANDER AGENT SYNTHESIZES AND RESOLVES CONFLICTS
    mossClient.updateAgentState(incidentId, 'COMMANDER', {
      status: 'SYNTHESIZING',
      currentTask: 'Comparing sector findings, detecting tactical conflicts, and synthesizing response plan'
    });
    broadcast('agent_states_updated', { incidentId, states: mossClient.getAgentStates(incidentId) });

    emitActivity(incidentId, 'COMMANDER', 'Comparing sector results for tactical conflicts...', 'commander');

    // Commander retrieves entire shared context history
    const allContext = mossClient.getAllContext(incidentId);
    const agentResultsMap: Record<AgentName, any> = {
      COMMANDER: null,
      MEDICAL: medicalResult,
      RESCUE: rescueResult,
      TRAFFIC: trafficResult,
      RESOURCE: resourceResult,
      COMMUNICATION: commsResult,
      SITUATION: situationResult
    };

    const commanderSynthesis = await geminiService.synthesizeCommander(
      incident.title,
      allContext,
      agentResultsMap,
      previousPlan
    );

    // 6. If conflicts detected, log them in MOSS and broadcast
    if (commanderSynthesis.conflictsDetected.length > 0) {
      for (const conf of commanderSynthesis.conflictsDetected) {
        emitActivity(
          incidentId,
          'COMMANDER',
          `CONFLICT RESOLVED: ${conf.title} between [${conf.agentsInvolved.join(', ')}] -> ${conf.resolution}`,
          'alert'
        );

        await mossClient.syncContextItem({
          incidentId,
          source: 'COMMANDER',
          type: 'CONFLICT_RESOLUTION',
          content: `${conf.description} Analysis: ${conf.commanderAnalysis}. Resolution: ${conf.resolution}`,
          summary: `Conflict Resolved: ${conf.title}`,
          metadata: {
            tags: ['conflict', 'resolution', ...conf.agentsInvolved.map((a) => a.toLowerCase())],
            confidence: 0.95,
            agent: 'COMMANDER',
            importance: 10
          }
        });
      }
    }

    // 7. Save Response Plan
    const newVersion = previousPlan ? previousPlan.version + 1 : 1;
    const plan: ResponsePlan = {
      planId: `plan-${incidentId}-v${newVersion}`,
      incidentId,
      version: newVersion,
      summary: commanderSynthesis.operationalSummary,
      priorities: commanderSynthesis.priorities,
      immediateActions: commanderSynthesis.immediateActions,
      responderAssignments: [
        { unit: 'ALS Ambulance 01 & 02', task: 'Patient Triage via North Bypass Corridor 4B', priority: 'CRITICAL', status: 'DISPATCHED' },
        { unit: 'Fire Engine 02', task: 'Class B Foam Blanket on smoking vehicle', priority: 'CRITICAL', status: 'DISPATCHED' },
        { unit: 'Heavy Rescue 01', task: 'Hydraulic Extrication of trapped occupants', priority: 'HIGH', status: 'EN_ROUTE' },
        { unit: 'Traffic Control Unit 03', task: 'Hard road closure at Exit 14 diversion', priority: 'HIGH', status: 'ON_SCENE' }
      ],
      accessRoutes: {
        primaryBlocked: trafficResult.primaryAccessBlocked,
        primaryBlockedReason: trafficResult.blockageReason,
        alternateRoute: trafficResult.alternateRoutes[0]?.routeName || 'North Bypass Route 4B',
        trafficConstraints: trafficResult.accessConstraints
      },
      medicalStrategy: {
        urgencyLevel: medicalResult.urgencyLevel,
        triageSummary: medicalResult.triageSummary,
        disclaimer: medicalResult.disclaimer
      },
      publicSafetyAlert: commsResult.publicSafetyAlert,
      conflictsDetected: commanderSynthesis.conflictsDetected.map((c) => ({
        ...c,
        resolvedAt: new Date().toISOString()
      })),
      resolutionNotes: commanderSynthesis.resolutionNotes,
      changeLog: commanderSynthesis.planChanges,
      whyExplanations: commanderSynthesis.whyExplanations.map((w) => ({
        ...w,
        timestamp: new Date().toISOString()
      })),
      approvalStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    await repository.savePlan(plan);

    // Store Plan in MOSS shared context
    await mossClient.syncContextItem({
      incidentId,
      source: 'COMMANDER',
      type: isReassessment ? 'REVISED_PLAN' : 'COMMANDER_DECISION',
      content: `${plan.summary}. Priorities: ${plan.priorities.join(' | ')}`,
      summary: `Response Plan v${plan.version}: ${plan.priorities[0]}`,
      metadata: {
        tags: ['plan', `v${plan.version}`, isReassessment ? 'revised' : 'initial'],
        confidence: commanderSynthesis.confidence,
        agent: 'COMMANDER',
        importance: 10
      }
    });

    mossClient.updateAgentState(incidentId, 'COMMANDER', {
      status: 'COMPLETE',
      currentTask: `Response Plan v${plan.version} synthesized and published for Human Review`
    });

    // 8. Record in audit log
    await repository.addAuditLog({
      logId: `log-${Date.now()}`,
      incidentId,
      actor: 'COMMANDER',
      actorType: 'AGENT',
      action: isReassessment ? 'REVISED_RESPONSE_PLAN' : 'PUBLISHED_RESPONSE_PLAN',
      details: `Plan v${plan.version} generated with ${plan.conflictsDetected.length} conflict(s) resolved.`,
      timestamp: new Date().toISOString()
    });

    // Broadcast updates to all connected UI clients
    broadcast('plan_updated', plan);
    broadcast('moss_context_updated', { incidentId, items: mossClient.getAllContext(incidentId) });
    broadcast('agent_states_updated', { incidentId, states: mossClient.getAgentStates(incidentId) });
    broadcast('incident_updated', incident);

    emitActivity(
      incidentId,
      'COMMANDER',
      `Response Plan v${plan.version} published! Ready for Human Operator review.`,
      'commander'
    );

    return plan;
  }

  /**
   * INJECT NEW INFORMATION:
   * The core interactive demonstration!
   * New information -> MOSS updated -> Agents reassess -> Commander resolves -> Plan updated
   */
  public async injectNewInformation(
    incidentId: string,
    content: string,
    author: string = 'Human Operator',
    source: 'HUMAN' | 'SENSOR' | 'FIELD_UNIT' = 'HUMAN',
    verified: boolean = true
  ): Promise<{ update: IncidentUpdate; revisedPlan: ResponsePlan }> {
    console.log(`[Orchestrator] Injecting new update into MOSS for ${incidentId}: "${content}"`);
    emitActivity(incidentId, 'HUMAN', `New Information Injected: "${content}"`, 'alert');

    // 1. Store update in repository
    const update: IncidentUpdate = {
      updateId: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      incidentId,
      source,
      author,
      content,
      verified,
      timestamp: new Date().toISOString()
    };
    await repository.addUpdate(update);

    // 2. Add to MOSS Shared Context
    await mossClient.syncContextItem({
      incidentId,
      source: 'HUMAN',
      type: 'HUMAN_UPDATE',
      content,
      summary: `Operator Update: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
      metadata: {
        tags: ['human-update', 'verified', 'incident-telemetry'],
        confidence: 1.0,
        importance: 10
      }
    });

    // 3. Record in audit log
    await repository.addAuditLog({
      logId: `log-${Date.now()}`,
      incidentId,
      actor: author,
      actorType: 'HUMAN',
      action: 'INJECT_UPDATE',
      details: content,
      timestamp: new Date().toISOString()
    });

    // 4. Trigger the multi-agent reassessment pipeline
    emitActivity(incidentId, 'MOSS', 'Shared context updated! Triggering agent reassessment...', 'moss');
    const revisedPlan = await this.runIncidentPipeline(incidentId, true, content);

    return { update, revisedPlan };
  }

  /**
   * ASK INDIVIDUAL AGENT A DIRECT QUESTION
   * Demonstrates human + agent collaborative query with MOSS grounding
   */
  public async askAgentQuestion(incidentId: string, agent: AgentName, question: string): Promise<string> {
    emitActivity(incidentId, 'HUMAN', `Asked [${agent} AGENT]: "${question}"`, 'info');

    // Retrieve specialized semantic context for this question
    const retrieved = await mossClient.retrieveSemanticContext({
      incidentId,
      query: question,
      agentRole: agent,
      topK: 5
    });

    const incident = await repository.getIncident(incidentId);
    const answer = await geminiService.askAgent(incident?.title || 'Emergency Incident', agent, question, retrieved);

    emitActivity(incidentId, agent, `Replied to operator: "${answer.substring(0, 80)}..."`, 'agent');

    // Store Q&A in MOSS
    await mossClient.syncContextItem({
      incidentId,
      source: agent,
      type: 'AGENT_ASSESSMENT',
      content: `Q: ${question} | A: ${answer}`,
      summary: `Operator Q&A with ${agent} Agent`,
      metadata: {
        tags: ['human-agent-interaction', agent.toLowerCase()],
        importance: 7
      }
    });

    broadcast('moss_context_updated', { incidentId, items: mossClient.getAllContext(incidentId) });
    return answer;
  }

  /**
   * HUMAN OVERRIDE ACTIONS
   */
  public async handleHumanAction(action: HumanAction): Promise<void> {
    await repository.recordHumanAction(action);
    emitActivity(action.incidentId, 'HUMAN', `Human Action: [${action.action}] ${action.content || ''}`, 'alert');

    if (action.action === 'APPROVE' && action.targetId) {
      const plans = await repository.getPlans(action.incidentId);
      const targetPlan = plans.find((p) => p.planId === action.targetId);
      if (targetPlan) {
        targetPlan.approvalStatus = 'APPROVED';
        targetPlan.approvedBy = action.user;
        await repository.savePlan(targetPlan);
        broadcast('plan_updated', targetPlan);
      }
    } else if (action.action === 'REJECT' && action.targetId) {
      const plans = await repository.getPlans(action.incidentId);
      const targetPlan = plans.find((p) => p.planId === action.targetId);
      if (targetPlan) {
        targetPlan.approvalStatus = 'REJECTED';
        await repository.savePlan(targetPlan);
        broadcast('plan_updated', targetPlan);
      }
    } else if (action.action === 'REQUEST_REASSESSMENT') {
      await this.runIncidentPipeline(action.incidentId, true, action.content);
    }

    await mossClient.syncContextItem({
      incidentId: action.incidentId,
      source: 'HUMAN',
      type: 'VERIFIED_FACT',
      content: `Human Action: ${action.action} - ${action.content}`,
      summary: `Operator: ${action.action}`,
      metadata: {
        tags: ['human-action', action.action.toLowerCase()],
        importance: 9
      }
    });

    broadcast('moss_context_updated', { incidentId: action.incidentId, items: mossClient.getAllContext(action.incidentId) });
  }
}

export const orchestrator = new AgentOrchestrator();
