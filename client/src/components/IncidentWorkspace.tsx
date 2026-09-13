import React from 'react';
import {
  Shield,
  Activity,
  Layers,
  FileText,
  Clock,
  User,
  PlusCircle,
  Zap,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  Incident,
  IncidentUpdate,
  ResponsePlan,
  MossContextItem,
  MossAgentState,
  ExplainabilityItem,
  AgentName
} from '../types';
import { ResponsePlanView } from './ResponsePlanView';
import { MossContextPanel } from './MossContextPanel';
import { AgentNetwork } from './AgentNetwork';
import { AgentConflictPanel } from './AgentConflictPanel';

interface IncidentWorkspaceProps {
  incident: Incident;
  updates: IncidentUpdate[];
  latestPlan: ResponsePlan | null;
  allPlans: ResponsePlan[];
  contextItems: MossContextItem[];
  agentStates: MossAgentState[];
  onOpenInject: () => void;
  onApprovePlan: (planId: string) => void;
  onRejectPlan: (planId: string) => void;
  onRequestReassessment: (content: string) => void;
  onSelectWhy: (item: ExplainabilityItem) => void;
  onAskAgent: (agent: AgentName) => void;
  onRefreshMoss: () => void;
}

export const IncidentWorkspace: React.FC<IncidentWorkspaceProps> = ({
  incident,
  updates,
  latestPlan,
  allPlans,
  contextItems,
  agentStates,
  onOpenInject,
  onApprovePlan,
  onRejectPlan,
  onRequestReassessment,
  onSelectWhy,
  onAskAgent,
  onRefreshMoss
}) => {
  return (
    <div className="space-y-5">
      {/* Top Conflict Resolution Banner */}
      <AgentConflictPanel conflicts={latestPlan?.conflictsDetected || []} />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column: Human Updates & Field Telemetry (3 cols) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-4 shadow-xl flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider m-0">
                  HUMAN TELEMETRY & FIELD INJECTIONS
                </h3>
              </div>
              <button
                onClick={onOpenInject}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-sm cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>+ Inject</span>
              </button>
            </div>

            {/* Injected Updates Timeline */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {updates.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">
                  No human updates injected yet. Use '+ Inject' above or in Flagship Demo.
                </div>
              ) : (
                updates.map((upd) => (
                  <div
                    key={upd.updateId}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                        [{upd.source}] {upd.author}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(upd.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans text-xs m-0">
                      "{upd.content}"
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-emerald-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Added to MOSS Shared Context
                      </span>
                      <span className="text-purple-400">Reassessment Triggered</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Response Plan (8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          <ResponsePlanView
            plan={latestPlan}
            allPlans={allPlans}
            onApprove={onApprovePlan}
            onReject={onRejectPlan}
            onRequestReassessment={onRequestReassessment}
            onSelectWhy={onSelectWhy}
          />
        </div>
      </div>

      {/* Agent Network Row */}
      <AgentNetwork agentStates={agentStates} onAskAgent={onAskAgent} />

      {/* MOSS Context Panel */}
      <MossContextPanel
        incidentId={incident.incidentId}
        contextItems={contextItems}
        onRefresh={onRefreshMoss}
      />
    </div>
  );
};
