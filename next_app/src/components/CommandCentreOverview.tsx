'use client';

import React from 'react';
import {
  Incident,
  ResponsePlan,
  MossContextItem,
  AgentResult,
  AuditLog,
  SystemHealth
} from '../types';
import {
  ShieldAlert,
  Radio,
  Brain,
  Cpu,
  Activity,
  AlertTriangle,
  Flame,
  Users,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  Compass
} from 'lucide-react';

interface CommandCentreOverviewProps {
  incidents: Incident[];
  activeIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onNavigateToWorkspace: () => void;
  contextItems: MossContextItem[];
  agentResults: AgentResult[];
  latestPlan: ResponsePlan | null;
  timeline: AuditLog[];
  systemHealth: SystemHealth | null;
}

export const CommandCentreOverview: React.FC<CommandCentreOverviewProps> = ({
  incidents,
  activeIncident,
  onSelectIncident,
  onNavigateToWorkspace,
  contextItems,
  agentResults,
  latestPlan,
  timeline,
  systemHealth
}) => {
  const totalCasualties = incidents.reduce((acc, curr) => acc + (curr.affectedPeople || 0), 0);
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080c14] text-slate-200 space-y-6">
      {/* Top Banner Disclaimer */}
      <div className="p-3.5 bg-orange-950/40 border border-orange-800/80 rounded-xl flex items-center justify-between text-xs text-orange-200 shadow-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
          <span>
            <b>HiDevs Hackathon Demonstration Prototype:</b> AI-generated coordination recommendations require human operator authorization before field deployment.
          </span>
        </div>
        <button
          onClick={onNavigateToWorkspace}
          className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0 ml-3"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>ACTIVE INCIDENTS</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{incidents.length}</div>
          <div className="text-[11px] text-red-400 font-semibold">{criticalIncidents} Critical Severity</div>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>REPORTED CASUALTIES</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{totalCasualties}</div>
          <div className="text-[11px] text-slate-400">Under continuous triage tracking</div>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>MOSS MEMORIES</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{contextItems.length}</div>
          <div className="text-[11px] text-purple-300">Shared semantic context items</div>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>ACTIVE AI AGENTS</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">7 / 7</div>
          <div className="text-[11px] text-emerald-400 font-semibold">Gemini 2.5 Flash Orchestrated</div>
        </div>
      </div>

      {/* Grid Content: Active Incidents & Multi-Agent Network */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents Column */}
        <div className="lg:col-span-2 bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                TACTICAL INCIDENT DISPATCH LIST
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.incidentId}
                onClick={() => {
                  onSelectIncident(inc);
                  onNavigateToWorkspace();
                }}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/80 cursor-pointer transition shadow hover:shadow-orange-950/20 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-orange-400">{inc.incidentId}</span>
                    <span className="font-bold text-slate-200 text-sm">{inc.title || inc.type}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold border bg-red-950 text-red-300 border-red-700">
                    {inc.severity}
                  </span>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed">
                  {inc.description}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                  <span>Location: <b>{inc.location}</b></span>
                  <span>Casualties: <b>{inc.affectedPeople}</b></span>
                  <span className="text-orange-400 font-semibold flex items-center space-x-1">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Architecture & Status Column */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-100 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>INTEGRATED SYSTEM STACK</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-purple-300">1. Moss Shared Context</div>
                <div className="text-[10px] text-slate-500">Cross-Agent Memory & Semantic Store</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">ONLINE</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-cyan-300">2. LiveKit Collaboration</div>
                <div className="text-[10px] text-slate-500">Real-time WebRTC Voice Room</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">READY</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-blue-300">3. Next.js 16 Frontend</div>
                <div className="text-[10px] text-slate-500">Command Centre & Workspace</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">ACTIVE</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-orange-300">4. Python & FastAPI Backend</div>
                <div className="text-[10px] text-slate-500">7 Autonomous Agents Orchestrator</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">RUNNING</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-300">5. Gemini API Reasoning</div>
                <div className="text-[10px] text-slate-500">Structured Autonomous Assessment</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">ENABLED</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-teal-300">6. MongoDB Datastore</div>
                <div className="text-[10px] text-slate-500">Application Records & Plans</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">CONNECTED</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-red-300">7. Interactive Map & Live GPS</div>
                <div className="text-[10px] text-slate-500">Leaflet Geolocation & Markers</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
