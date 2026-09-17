'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Incident,
  MapMarker,
  MossContextItem,
  AgentResult,
  ResponsePlan,
  AuditLog,
  LocationRecord,
  SystemHealth
} from '../types';
import { api } from '../services/api';
import { Navbar, NavTab } from '../components/Navbar';
import { IncidentWorkspace } from '../components/IncidentWorkspace';
import { CommandCentreOverview } from '../components/CommandCentreOverview';
import { AgentNetwork } from '../components/AgentNetwork';
import { MossContextPanel } from '../components/MossContextPanel';
import { ResponsePlanView } from '../components/ResponsePlanView';
import { LiveKitRoom } from '../components/LiveKitRoom';
import { EmergencyMap } from '../components/EmergencyMap';
import { AuditTimeline } from '../components/AuditTimeline';
import { ResourcesView } from '../components/ResourcesView';
import { SimulationModal } from '../components/SimulationModal';
import { NewIncidentModal } from '../components/NewIncidentModal';
import { SettingsModal } from '../components/SettingsModal';
import { LandingHero } from '../components/LandingHero';
import { AuthProvider, useAuth } from '../services/authContext';
import { AuthModal } from '../components/AuthModal';

// Default Flagship fallback incident for guaranteed zero-downtime render
const DEFAULT_INCIDENT: Incident = {
  incidentId: 'RG-2026-0001',
  type: 'TRAFFIC_COLLISION',
  title: 'Interstate 95 Multi-Vehicle Pileup',
  location: 'I-95 Northbound at Mile Marker 142',
  latitude: 37.7749,
  longitude: -122.4194,
  locationSource: 'SIMULATED',
  description:
    'Three vehicles have collided on a highway. Six people are reportedly involved. Two people may have serious injuries. One vehicle is smoking, and the highway is partially blocked.',
  severity: 'CRITICAL',
  affectedPeople: 6,
  hazards: ['SMOKING_VEHICLE', 'PARTIAL_ROAD_BLOCKAGE', 'TRAPPED_OCCUPANTS'],
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const DEFAULT_PLAN: ResponsePlan = {
  planId: 'PLAN-RG-2026-0001-v1',
  incidentId: 'RG-2026-0001',
  version: 1,
  primaryObjective: 'Rapid extrication, primary casualty triage, and corridor stabilization.',
  rationale: 'Initial Plan v1 synthesized from concurrent assessments across 6 specialized agents.',
  uncertainties: [
    'Non-ambulatory victim count pending on-scene survey.',
    'Live traffic tailback queue length upstream.'
  ],
  actions: [
    {
      id: 'ACT-v1-1',
      title: 'Deploy Heavy Extrication Cutters to Vehicle 1 & 2',
      agent: 'RESCUE',
      priority: 'CRITICAL',
      description: 'Perform roof removal and door spreading to extract trapped non-ambulatory occupants.',
      estimatedTime: '5 - 8 min',
      requiresApproval: true,
      approved: false
    },
    {
      id: 'ACT-v1-2',
      title: 'Establish Advanced Life Support Triage Base',
      agent: 'MEDICAL',
      priority: 'HIGH',
      description: 'Set up Red/Yellow/Green sorting station at Staging Area Alpha.',
      estimatedTime: '4 min',
      requiresApproval: true,
      approved: false
    },
    {
      id: 'ACT-v1-3',
      title: 'Highway Patrol Traffic Diversion at Exit 41',
      agent: 'TRAFFIC',
      priority: 'HIGH',
      description: 'Divert civilian vehicles upstream to preserve shoulder for inbound emergency units.',
      estimatedTime: '3 min',
      requiresApproval: true,
      approved: false
    }
  ],
  createdBy: 'COMMANDER_AGENT',
  status: 'PROPOSED',
  createdAt: new Date().toISOString()
};

function DashboardApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('WORKSPACE');
  const [incidents, setIncidents] = useState<Incident[]>([DEFAULT_INCIDENT]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(DEFAULT_INCIDENT);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [contextItems, setContextItems] = useState<MossContextItem[]>([]);
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [latestPlan, setLatestPlan] = useState<ResponsePlan | null>(DEFAULT_PLAN);
  const [allPlans, setAllPlans] = useState<ResponsePlan[]>([DEFAULT_PLAN]);
  const [timeline, setTimeline] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Modals
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load Incident Data
  const loadIncidentData = useCallback(async (incidentId: string) => {
    try {
      const [mapRes, ctxRes, agentRes, planRes, timeRes] = await Promise.allSettled([
        api.getMapData(incidentId),
        api.getMossContext(incidentId),
        api.getAgentResults(incidentId),
        api.getResponsePlan(incidentId),
        api.getTimeline(incidentId),
      ]);

      if (mapRes.status === 'fulfilled' && mapRes.value.markers) {
        setMarkers(mapRes.value.markers);
      }
      if (ctxRes.status === 'fulfilled') {
        setContextItems(ctxRes.value);
      }
      if (agentRes.status === 'fulfilled') {
        setAgentResults(agentRes.value);
      }
      if (planRes.status === 'fulfilled') {
        if (planRes.value.latestPlan) {
          setLatestPlan(planRes.value.latestPlan);
        }
        if (planRes.value.history) {
          setAllPlans(planRes.value.history);
        }
      }
      if (timeRes.status === 'fulfilled') {
        setTimeline(timeRes.value);
      }
    } catch (err) {
      console.warn('Error fetching incident telemetry:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    let isMounted = true;
    const initSystem = async () => {
      try {
        const [healthData, incList] = await Promise.all([
          api.getHealth().catch(() => null),
          api.getIncidents().catch(() => []),
        ]);

        if (!isMounted) return;
        if (healthData) setSystemHealth(healthData);

        if (incList && incList.length > 0) {
          setIncidents(incList);
          const first = incList[0];
          setActiveIncident(first);
          loadIncidentData(first.incidentId);
        } else {
          loadIncidentData(DEFAULT_INCIDENT.incidentId);
        }
      } catch (e) {
        console.warn('Initial system load notice:', e);
      }
    };

    initSystem();

    return () => {
      isMounted = false;
    };
  }, [loadIncidentData]);

  // Periodic Telemetry Sync
  useEffect(() => {
    if (!activeIncident?.incidentId) return;

    const interval = setInterval(() => {
      loadIncidentData(activeIncident.incidentId);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIncident?.incidentId, loadIncidentData]);

  // Handle Plan Approval
  const handleApprovePlan = async (approved: boolean, notes?: string) => {
    if (!activeIncident) return;
    setIsLoading(true);
    try {
      const operatorName = user ? `${user.name} (${user.role})` : 'Chief Sarah Jenkins (COMMANDER_OPERATOR)';
      const updatedPlan = await api.approvePlan(activeIncident.incidentId, approved, notes, operatorName);
      setLatestPlan(updatedPlan);
      await loadIncidentData(activeIncident.incidentId);
    } catch (err) {
      console.warn('Approval request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Injected Update (Flagship Reassessment)
  const handleInjectUpdate = async (content: string) => {
    if (!activeIncident) return;
    setIsLoading(true);
    try {
      await api.injectSimulationUpdate(activeIncident.incidentId, content);
      await loadIncidentData(activeIncident.incidentId);
    } catch (err) {
      console.warn('Injected update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger manual analysis
  const handleTriggerAnalysis = async () => {
    if (!activeIncident) return;
    setIsLoading(true);
    try {
      await api.triggerAnalysis(activeIncident.incidentId);
      await loadIncidentData(activeIncident.incidentId);
    } catch (err) {
      console.warn('Analysis trigger error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Record user browser live location
  const handleLocationRecorded = async (loc: Partial<LocationRecord>) => {
    if (!activeIncident) return;
    try {
      await api.recordLocation(activeIncident.incidentId, {
        incidentId: activeIncident.incidentId,
        latitude: loc.latitude || 0,
        longitude: loc.longitude || 0,
        accuracy: loc.accuracy,
        source: loc.source || 'BROWSER_GEOLOCATION',
        isSimulated: loc.isSimulated || false,
      });
      await loadIncidentData(activeIncident.incidentId);
    } catch (err) {
      console.warn('Error recording location to backend:', err);
    }
  };

  // Start flagship simulation
  const handleStartSimulation = async () => {
    setIsLoading(true);
    try {
      await api.startSimulation();
      const incList = await api.getIncidents();
      if (incList && incList.length > 0) {
        setIncidents(incList);
        const flagship = incList.find((i) => i.incidentId === 'RG-2026-0001') || incList[0];
        setActiveIncident(flagship);
        await loadIncidentData(flagship.incidentId);
      }
    } catch (err) {
      console.warn('Simulation start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new incident
  const handleCreateIncident = async (newInc: Partial<Incident>) => {
    setIsLoading(true);
    try {
      const created = await api.createIncident(newInc);
      setIncidents((prev) => [created, ...prev]);
      setActiveIncident(created);
      await loadIncidentData(created.incidentId);
    } catch (err) {
      console.warn('Incident creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080c14] overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        systemHealth={systemHealth}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Tab View Switcher */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'WORKSPACE' && (
          <IncidentWorkspace
            incidents={incidents}
            activeIncident={activeIncident}
            onSelectIncident={(inc) => {
              setActiveIncident(inc);
              loadIncidentData(inc.incidentId);
            }}
            onNewIncidentClick={() => setIsNewIncidentOpen(true)}
            markers={markers}
            contextItems={contextItems}
            agentResults={agentResults}
            latestPlan={latestPlan}
            allPlans={allPlans}
            timeline={timeline}
            onApprovePlan={handleApprovePlan}
            onInjectUpdate={handleInjectUpdate}
            onTriggerAnalysis={handleTriggerAnalysis}
            onLocationRecorded={handleLocationRecorded}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'COMMAND_CENTRE' && (
          <CommandCentreOverview
            incidents={incidents}
            activeIncident={activeIncident}
            onSelectIncident={(inc) => {
              setActiveIncident(inc);
              loadIncidentData(inc.incidentId);
            }}
            onNavigateToWorkspace={() => setActiveTab('WORKSPACE')}
            contextItems={contextItems}
            agentResults={agentResults}
            latestPlan={latestPlan}
            timeline={timeline}
            systemHealth={systemHealth}
          />
        )}

        {activeTab === 'LIVE_INCIDENTS' && (
          <div className="p-6 overflow-y-auto h-full space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-wide">
                Active Incidents Directory ({incidents.length})
              </h1>
              <button
                onClick={() => setIsNewIncidentOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition shadow"
              >
                + Declare Incident
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.map((inc) => (
                <div
                  key={inc.incidentId}
                  onClick={() => {
                    setActiveIncident(inc);
                    loadIncidentData(inc.incidentId);
                    setActiveTab('WORKSPACE');
                  }}
                  className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-orange-500 cursor-pointer transition shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-orange-400">{inc.incidentId}</span>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold text-[10px]">
                      {inc.severity}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">{inc.title || inc.type}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{inc.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>{inc.location}</span>
                    <span className="text-orange-400 font-bold">Open Workspace →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'MAP' && (
          <div className="p-4 h-full">
            <EmergencyMap
              incident={activeIncident}
              markers={markers}
              onLocationRecorded={handleLocationRecorded}
            />
          </div>
        )}

        {activeTab === 'SHARED_CONTEXT' && (
          <div className="p-4 h-full">
            <MossContextPanel items={contextItems} isDemoFallback={true} />
          </div>
        )}

        {activeTab === 'AGENT_NETWORK' && (
          <div className="p-4 h-full">
            <AgentNetwork
              agentResults={agentResults}
              onTriggerAnalysis={handleTriggerAnalysis}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === 'RESPONSE_PLANS' && (
          <div className="p-4 h-full max-w-4xl mx-auto">
            <ResponsePlanView
              currentPlan={latestPlan}
              allPlans={allPlans}
              onApprove={handleApprovePlan}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === 'COLLABORATION' && (
          <div className="p-4 h-full max-w-5xl mx-auto">
            <LiveKitRoom incidentId={activeIncident?.incidentId || 'RG-2026-0001'} />
          </div>
        )}

        {activeTab === 'TIMELINE' && (
          <div className="p-4 h-full max-w-4xl mx-auto">
            <AuditTimeline logs={timeline} />
          </div>
        )}

        {activeTab === 'AUDIT_LOG' && (
          <div className="p-4 h-full max-w-4xl mx-auto">
            <AuditTimeline logs={timeline} />
          </div>
        )}

        {activeTab === 'RESOURCES' && (
          <div className="p-4 h-full max-w-5xl mx-auto">
            <ResourcesView />
          </div>
        )}

        {activeTab === 'SIMULATION' && (
          <LandingHero
            onEnterWorkspace={() => setActiveTab('WORKSPACE')}
            onOpenSimulation={() => setIsSimulationOpen(true)}
          />
        )}

        {activeTab === 'SETTINGS' && (
          <div className="p-6 max-w-3xl mx-auto overflow-y-auto h-full">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                RescueGrid AI Platform Diagnostics
              </h2>
              <div className="text-xs text-slate-400 space-y-2">
                <p>FastAPI Backend: http://localhost:8000/api</p>
                <p>Gemini AI Status: {systemHealth?.services?.geminiAiReasoning?.status || 'ONLINE'}</p>
                <p>MOSS Context Status: {systemHealth?.services?.mossSharedContext?.status || 'ONLINE'}</p>
                <p>LiveKit Collaboration: {systemHealth?.services?.livekitCollaboration?.status || 'ONLINE'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onStartSimulation={handleStartSimulation}
        onInjectEscalation={() =>
          handleInjectUpdate('Fire is now reported in one vehicle, and the primary access lane is blocked.')
        }
        currentPlanVersion={latestPlan?.version || 1}
        isLoading={isLoading}
      />

      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        onSubmit={handleCreateIncident}
        isLoading={isLoading}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemHealth={systemHealth}
      />

      <AuthModal />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}
