import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Radio,
  MapPin,
  Shield,
  Brain,
  FileText,
  Truck,
  MessageSquare,
  PlayCircle,
  Clock,
  Settings as SettingsIcon,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import {
  Incident,
  IncidentUpdate,
  ResponsePlan,
  MossContextItem,
  MossAgentState,
  EmergencyResource,
  AuditLog,
  LiveActivity,
  ExplainabilityItem,
  SettingsStatus,
  AgentName
} from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';
import { AuthProvider, useAuth } from './services/authContext';
import { ToastProvider, useToast } from './components/ToastContainer';
import { sounds } from './services/soundEffects';

import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { IncidentWorkspace } from './components/IncidentWorkspace';
import { MossContextPanel } from './components/MossContextPanel';
import { AgentNetwork } from './components/AgentNetwork';
import { ResponsePlanView } from './components/ResponsePlanView';
import { EmergencyMap } from './components/EmergencyMap';
import { ResourceManagement } from './components/ResourceManagement';
import { CommunicationBriefing } from './components/CommunicationBriefing';
import { AuditTimeline } from './components/AuditTimeline';
import { SimulationModal } from './components/SimulationModal';
import { InjectUpdateModal } from './components/InjectUpdateModal';
import { AskAgentModal } from './components/AskAgentModal';
import { WhyExplainModal } from './components/WhyExplainModal';
import { SettingsModal } from './components/SettingsModal';
import { NewIncidentModal } from './components/NewIncidentModal';
import { AuthModal } from './components/AuthModal';

type NavTab =
  | 'OVERVIEW'
  | 'LIVE INCIDENTS'
  | 'INCIDENT MAP'
  | 'AGENT NETWORK'
  | 'SHARED CONTEXT'
  | 'RESOURCES'
  | 'RESPONSE PLANS'
  | 'COMMUNICATION'
  | 'SIMULATION'
  | 'AUDIT LOG';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<NavTab>('OVERVIEW');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncidentId, setActiveIncidentId] = useState<string>('RG-2026-0001');

  // Incident Details State
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [latestPlan, setLatestPlan] = useState<ResponsePlan | null>(null);
  const [allPlans, setAllPlans] = useState<ResponsePlan[]>([]);
  const [contextItems, setContextItems] = useState<MossContextItem[]>([]);
  const [agentStates, setAgentStates] = useState<MossAgentState[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);

  // System status
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [isInjectOpen, setIsInjectOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isAskAgentOpen, setIsAskAgentOpen] = useState(false);
  const [targetAgentForAsk, setTargetAgentForAsk] = useState<AgentName>('TRAFFIC');
  const [selectedWhyItem, setSelectedWhyItem] = useState<ExplainabilityItem | null>(null);

  // Toggle tactical sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playClick();
  };

  // Fetch full incident data
  const loadIncidentData = useCallback(async (id: string) => {
    try {
      const data = await api.getIncidentDetails(id);
      if (data.incident) {
        setActiveIncident(data.incident);
        setUpdates(data.updates || []);
        setLatestPlan(data.latestPlan);
        setAgentStates(data.agentStates || []);
        setResources(data.resources || []);
        setAuditLogs(data.auditLogs || []);

        const [plans, mossCtx] = await Promise.all([
          api.getPlans(id),
          api.getMossContext(id)
        ]);
        setAllPlans(plans);
        setContextItems(mossCtx);
      }
    } catch (err) {
      console.error('Failed to load incident details:', err);
    }
  }, []);

  // Fetch incident list and system settings
  const refreshIncidents = useCallback(async () => {
    try {
      const incList = await api.getIncidents();
      setIncidents(incList);
      if (incList.length > 0 && !activeIncidentId) {
        setActiveIncidentId(incList[0].incidentId);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  }, [activeIncidentId]);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettingsStatus(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshIncidents();
    refreshSettings();
  }, [refreshIncidents, refreshSettings]);

  // When activeIncidentId changes, load details & join Socket.IO room
  useEffect(() => {
    if (activeIncidentId) {
      loadIncidentData(activeIncidentId);
      const socket = getSocket();
      socket.emit('join_incident', activeIncidentId);
    }
  }, [activeIncidentId, loadIncidentData]);

  // Socket.IO event listeners
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handlePlanUpdated = (newPlan: ResponsePlan) => {
      if (newPlan.incidentId === activeIncidentId) {
        setLatestPlan(newPlan);
        setAllPlans((prev) => {
          const filtered = prev.filter((p) => p.planId !== newPlan.planId);
          return [newPlan, ...filtered];
        });
        sounds.playSuccess();
        showToast('success', `Response Plan v${newPlan.version} Synthesized`, `Commander updated tactical directives based on MOSS context.`);
      }
    };

    const handleMossContextUpdated = (data: { incidentId: string; items: MossContextItem[] }) => {
      if (data.incidentId === activeIncidentId) {
        setContextItems(data.items);
      }
    };

    const handleAgentStatesUpdated = (data: { incidentId: string; states: MossAgentState[] }) => {
      if (data.incidentId === activeIncidentId) {
        setAgentStates(data.states);
      }
    };

    const handleIncidentUpdated = (updatedInc: Incident) => {
      if (updatedInc.incidentId === activeIncidentId) {
        setActiveIncident(updatedInc);
      }
      setIncidents((prev) =>
        prev.map((i) => (i.incidentId === updatedInc.incidentId ? updatedInc : i))
      );
    };

    const handleLiveActivity = (activity: LiveActivity) => {
      if (activity.incidentId === activeIncidentId) {
        setLiveActivities((prev) => [activity, ...prev].slice(0, 30));
        if (activity.type === 'alert') {
          sounds.playAlert();
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('plan_updated', handlePlanUpdated);
    socket.on('moss_context_updated', handleMossContextUpdated);
    socket.on('agent_states_updated', handleAgentStatesUpdated);
    socket.on('incident_updated', handleIncidentUpdated);
    socket.on('live_activity', handleLiveActivity);

    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('plan_updated', handlePlanUpdated);
      socket.off('moss_context_updated', handleMossContextUpdated);
      socket.off('agent_states_updated', handleAgentStatesUpdated);
      socket.off('incident_updated', handleIncidentUpdated);
      socket.off('live_activity', handleLiveActivity);
    };
  }, [activeIncidentId, showToast]);

  // Actions
  const handleInjectUpdate = async (content: string, author: string) => {
    if (!activeIncidentId) return;
    sounds.playAlert();
    showToast('info', 'Injecting Telemetry', 'Submitting to MOSS shared context and running Gemini AI reassessment...');

    const res = await api.injectUpdate(activeIncidentId, content, author || user?.name || 'Human Operator', true);
    if (res.update) {
      setUpdates((prev) => [res.update, ...prev]);
    }
    if (res.revisedPlan) {
      setLatestPlan(res.revisedPlan);
      setAllPlans((prev) => [res.revisedPlan, ...prev]);
    }
    loadIncidentData(activeIncidentId);
  };

  const handleApprovePlan = async (planId: string) => {
    if (!activeIncidentId) return;
    sounds.playSuccess();
    await api.handleAction(activeIncidentId, 'APPROVE', planId, `Approved by ${user?.name || 'Lead Commander'}`);
    showToast('success', 'Plan Authorized', 'Official response plan approved and operationalized.');
    loadIncidentData(activeIncidentId);
  };

  const handleRejectPlan = async (planId: string) => {
    if (!activeIncidentId) return;
    sounds.playAlert();
    await api.handleAction(activeIncidentId, 'REJECT', planId, `Rejected by ${user?.name || 'Lead Commander'}`);
    showToast('alert', 'Plan Rejected', 'Response plan marked rejected by command officer.');
    loadIncidentData(activeIncidentId);
  };

  const handleRequestReassessment = async (note?: string) => {
    if (!activeIncidentId) return;
    sounds.playClick();
    showToast('info', 'Reassessment Dispatched', 'Requesting multi-agent reassessment pipeline...');
    await api.handleAction(
      activeIncidentId,
      'REQUEST_REASSESSMENT',
      undefined,
      note || `${user?.name || 'Operator'} requested multi-agent reassessment`
    );
    loadIncidentData(activeIncidentId);
  };

  const handleOpenAskAgent = (agent?: AgentName) => {
    sounds.playClick();
    if (agent) setTargetAgentForAsk(agent);
    setIsAskAgentOpen(true);
  };

  const handleCreateIncident = async (payload: Partial<Incident>) => {
    sounds.playSuccess();
    const res = await api.createIncident(payload);
    if (res.incident) {
      setActiveIncidentId(res.incident.incidentId);
      refreshIncidents();
      loadIncidentData(res.incident.incidentId);
      showToast('success', 'Incident Initialized', `Created ${res.incident.title}. Multi-agent response active.`);
    }
  };

  const navItems: { label: NavTab; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'OVERVIEW', icon: LayoutDashboard },
    { label: 'LIVE INCIDENTS', icon: Radio },
    { label: 'INCIDENT MAP', icon: MapPin },
    { label: 'AGENT NETWORK', icon: Shield },
    { label: 'SHARED CONTEXT', icon: Brain },
    { label: 'RESPONSE PLANS', icon: FileText },
    { label: 'RESOURCES', icon: Truck },
    { label: 'COMMUNICATION', icon: MessageSquare },
    { label: 'SIMULATION', icon: PlayCircle },
    { label: 'AUDIT LOG', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        incidents={incidents}
        activeIncident={activeIncident}
        onSelectIncident={(id) => {
          sounds.playClick();
          setActiveIncidentId(id);
        }}
        onNewIncident={() => {
          sounds.playClick();
          setIsNewIncidentOpen(true);
        }}
        onOpenSimulation={() => {
          sounds.playClick();
          setIsSimulationOpen(true);
        }}
        onOpenSettings={() => {
          sounds.playClick();
          setIsSettingsOpen(true);
        }}
        settingsStatus={settingsStatus}
        contextCount={contextItems.length}
        socketConnected={socketConnected}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Navigation Tabs */}
      <nav className="border-b border-slate-800 bg-[#0a0f1d] px-4 sticky top-[57px] z-30 overflow-x-auto shadow-md">
        <div className="max-w-[1700px] mx-auto flex items-center gap-1 text-xs font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  sounds.playClick();
                  if (item.label === 'SIMULATION') {
                    setIsSimulationOpen(true);
                  } else {
                    setActiveTab(item.label);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-3 border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.label === 'SHARED CONTEXT' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {contextItems.length}
                  </span>
                )}
                {item.label === 'AGENT NETWORK' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    7
                  </span>
                )}
                {item.label === 'INCIDENT MAP' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    FREE LIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 space-y-6">
        {!activeIncident ? (
          <div className="p-12 text-center text-slate-400 font-mono text-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6" />
            </div>
            <div>Loading RescueGrid AI Emergency Operations Center...</div>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && (
              <OverviewDashboard
                incident={activeIncident}
                plan={latestPlan}
                contextItems={contextItems}
                agentStates={agentStates}
                liveActivities={liveActivities}
                onOpenInject={() => setIsInjectOpen(true)}
                onRequestReassessment={() => handleRequestReassessment()}
                onOpenAskAgent={() => handleOpenAskAgent('TRAFFIC')}
                onSwitchTab={(t) => setActiveTab(t as NavTab)}
                onSelectWhy={(item) => setSelectedWhyItem(item)}
              />
            )}

            {activeTab === 'LIVE INCIDENTS' && (
              <IncidentWorkspace
                incident={activeIncident}
                updates={updates}
                latestPlan={latestPlan}
                allPlans={allPlans}
                contextItems={contextItems}
                agentStates={agentStates}
                onOpenInject={() => setIsInjectOpen(true)}
                onApprovePlan={handleApprovePlan}
                onRejectPlan={handleRejectPlan}
                onRequestReassessment={handleRequestReassessment}
                onSelectWhy={(item) => setSelectedWhyItem(item)}
                onAskAgent={handleOpenAskAgent}
                onRefreshMoss={() => loadIncidentData(activeIncidentId)}
              />
            )}

            {activeTab === 'INCIDENT MAP' && (
              <EmergencyMap
                location={activeIncident.location}
                title={activeIncident.title}
                hazards={activeIncident.hazards}
                resources={resources}
                primaryBlocked={latestPlan?.accessRoutes?.primaryBlocked ?? true}
              />
            )}

            {activeTab === 'AGENT NETWORK' && (
              <div className="space-y-5">
                <AgentNetwork
                  agentStates={agentStates}
                  onAskAgent={handleOpenAskAgent}
                />
              </div>
            )}

            {activeTab === 'SHARED CONTEXT' && (
              <MossContextPanel
                incidentId={activeIncident.incidentId}
                contextItems={contextItems}
                onRefresh={() => loadIncidentData(activeIncidentId)}
              />
            )}

            {activeTab === 'RESPONSE PLANS' && (
              <ResponsePlanView
                plan={latestPlan}
                allPlans={allPlans}
                onApprove={handleApprovePlan}
                onReject={handleRejectPlan}
                onRequestReassessment={handleRequestReassessment}
                onSelectWhy={(item) => setSelectedWhyItem(item)}
              />
            )}

            {activeTab === 'RESOURCES' && (
              <ResourceManagement resources={resources} />
            )}

            {activeTab === 'COMMUNICATION' && (
              <CommunicationBriefing plan={latestPlan} />
            )}

            {activeTab === 'AUDIT LOG' && (
              <AuditTimeline
                auditLogs={auditLogs}
                updates={updates}
                incidentId={activeIncident.incidentId}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06080e] px-4 py-3 text-center text-xs font-mono text-slate-500">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>RESCUEGRID AI • COLLABORATIVE MULTI-AGENT EMERGENCY PLATFORM</span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center gap-2">
            <span>Powered by MOSS Shared Context</span>
            <span>•</span>
            <span>Google Gemini 3.6 Flash</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
            <span>•</span>
            <span>Free OpenStreetMap Live Telemetry</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal />

      <InjectUpdateModal
        isOpen={isInjectOpen}
        onClose={() => setIsInjectOpen(false)}
        onInject={handleInjectUpdate}
      />

      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onScenarioLoaded={(id) => {
          sounds.playSuccess();
          setActiveIncidentId(id);
          refreshIncidents();
          showToast('info', 'Scenario Initialized', 'Emergency scenario loaded with fresh MOSS context space.');
        }}
        onInjectUpdate={handleInjectUpdate}
        activeIncidentId={activeIncidentId}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        status={settingsStatus}
        onRefreshStatus={refreshSettings}
      />

      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        onCreate={handleCreateIncident}
      />

      <AskAgentModal
        isOpen={isAskAgentOpen}
        onClose={() => setIsAskAgentOpen(false)}
        incidentId={activeIncidentId}
        initialAgent={targetAgentForAsk}
      />

      <WhyExplainModal
        item={selectedWhyItem}
        onClose={() => setSelectedWhyItem(null)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
