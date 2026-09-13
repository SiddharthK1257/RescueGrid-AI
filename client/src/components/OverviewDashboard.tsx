import React from 'react';
import {
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  Shield,
  Brain,
  Layers,
  Zap,
  RotateCcw,
  MessageCircleQuestion,
  Compass,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  Radio,
  FileText
} from 'lucide-react';
import {
  Incident,
  ResponsePlan,
  MossContextItem,
  MossAgentState,
  LiveActivity,
  ExplainabilityItem
} from '../types';
import { AgentConflictPanel } from './AgentConflictPanel';

interface OverviewDashboardProps {
  incident: Incident;
  plan: ResponsePlan | null;
  contextItems: MossContextItem[];
  agentStates: MossAgentState[];
  liveActivities: LiveActivity[];
  onOpenInject: () => void;
  onRequestReassessment: () => void;
  onOpenAskAgent: () => void;
  onSwitchTab: (tab: string) => void;
  onSelectWhy: (item: ExplainabilityItem) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  incident,
  plan,
  contextItems,
  agentStates,
  liveActivities,
  onOpenInject,
  onRequestReassessment,
  onOpenAskAgent,
  onSwitchTab,
  onSelectWhy
}) => {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 glow-critical';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE RESPONSE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 glow-active';
      case 'ESCALATED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 glow-critical';
      case 'CONTAINED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Critical Incident Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1322] to-slate-900 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                INCIDENT ID: {incident.incidentId}
              </span>
              <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border ${getSeverityBadge(incident.severity)}`}>
                SEVERITY: {incident.severity}
              </span>
              <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border ${getStatusBadge(incident.status)}`}>
                STATUS: {incident.status}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Type: {incident.type}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide font-sans m-0 p-0">
              {incident.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {incident.location.address}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white">{incident.affectedPeople}</strong> Affected / Trapped
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Updated: {new Date(incident.updatedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenInject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold tracking-wide shadow-lg shadow-cyan-950 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>+ INJECT UPDATE</span>
            </button>

            <button
              onClick={onRequestReassessment}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>Reassess</span>
            </button>

            <button
              onClick={onOpenAskAgent}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <MessageCircleQuestion className="w-4 h-4 text-cyan-400" />
              <span>Ask Agent</span>
            </button>
          </div>
        </div>

        {/* Hazard Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
            ON-SCENE HAZARDS:
          </span>
          {incident.hazards.map((h, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] font-mono flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Plan Version */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>RESPONSE PLAN</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            v{plan?.version || 1}.0
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">
            Status: {plan?.approvalStatus || 'ACTIVE'}
          </div>
        </div>

        {/* Metric 2: MOSS Context Items */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>MOSS MEMORY</span>
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300">
            {contextItems.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Shared Context Items
          </div>
        </div>

        {/* Metric 3: Active Agents */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>ACTIVE AGENTS</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {agentStates.length || 7}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">
            Multi-Agent State Synced
          </div>
        </div>

        {/* Metric 4: Conflicts Resolved */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TACTICAL CONFLICTS</span>
            <GitCommit className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {plan?.conflictsDetected?.length || 0}
          </div>
          <div className="text-[10px] font-mono text-amber-400/80 mt-1">
            Resolved by Commander
          </div>
        </div>

        {/* Metric 5: Casualties Urgency */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TRIAGE URGENCY</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {plan?.medicalStrategy?.urgencyLevel || 'CRITICAL'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            {incident.affectedPeople} affected occupants
          </div>
        </div>
      </div>

      {/* Conflict Resolution Banner (if any conflicts detected) */}
      <AgentConflictPanel conflicts={plan?.conflictsDetected || []} />

      {/* Main Split: Response Plan Highlights & Map / Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Response Plan Directives */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider m-0">
                  CURRENT COLLABORATIVE DIRECTIVES (v{plan?.version || 1}.0)
                </h3>
              </div>
              <button
                onClick={() => onSwitchTab('RESPONSE PLANS')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Plan View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Operational Summary */}
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              {plan?.summary || 'Formulating collaborative response plan...'}
            </div>

            {/* Strategic Priorities */}
            <div>
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                STRATEGIC PRIORITIES:
              </h4>
              <div className="space-y-1.5">
                {(plan?.priorities || []).slice(0, 4).map((priority, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {pIdx + 1}
                    </span>
                    <span className="leading-snug">{priority}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detour Guidance */}
            {plan?.accessRoutes && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  plan.accessRoutes.primaryBlocked
                    ? 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                    : 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                }`}
              >
                <div className="font-mono font-bold uppercase text-[11px] mb-1">
                  ACCESS STATUS: {plan.accessRoutes.primaryBlocked ? '⛔ HARD ROAD BLOCKAGE' : '✅ OPEN'}
                </div>
                <p className="m-0 text-slate-300 text-xs font-sans">
                  {plan.accessRoutes.primaryBlocked
                    ? `Designated Detour: ${plan.accessRoutes.alternateRoute} (${plan.accessRoutes.primaryBlockedReason})`
                    : 'Primary corridor accessible.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Multi-Agent Activity Ticker & MOSS Stream Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider m-0">
                  REAL-TIME MULTI-AGENT ACTIVITY
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">STREAM ACTIVE</span>
            </div>

            {/* Live Activity Items */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {liveActivities.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">
                  Awaiting live agent events...
                </div>
              ) : (
                liveActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          act.agent === 'COMMANDER'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : act.agent === 'MOSS'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : act.agent === 'HUMAN'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        [{act.agent}]
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-snug m-0 text-[11px] font-mono">
                      {act.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <button
                onClick={() => onSwitchTab('SHARED CONTEXT')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect MOSS Memory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onSwitchTab('INCIDENT MAP')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Tactical Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
