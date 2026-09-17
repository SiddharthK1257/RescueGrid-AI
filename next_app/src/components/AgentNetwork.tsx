'use client';

import React from 'react';
import { AgentResult } from '../types';
import {
  Shield,
  HeartPulse,
  Flame,
  Navigation,
  Truck,
  MessageSquare,
  Activity,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';

interface AgentNetworkProps {
  agentResults: AgentResult[];
  agentStatuses?: Record<string, string>;
  onTriggerAnalysis?: () => void;
  isLoading?: boolean;
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({
  agentResults,
  agentStatuses = {},
  onTriggerAnalysis,
  isLoading = false
}) => {
  const agentsConfig = [
    {
      name: 'COMMANDER',
      title: 'Incident Commander',
      role: 'Strategic Coordination & Plan Synthesis',
      icon: Shield,
      color: 'text-orange-400 bg-orange-950/50 border-orange-700',
    },
    {
      name: 'MEDICAL',
      title: 'Medical Triage Lead',
      role: 'START Triage & Casualty Sorting',
      icon: HeartPulse,
      color: 'text-red-400 bg-red-950/50 border-red-700',
    },
    {
      name: 'RESCUE',
      title: 'Heavy Rescue & Extrication',
      role: 'Hazard Containment & Structural Extraction',
      icon: Flame,
      color: 'text-amber-400 bg-amber-950/50 border-amber-700',
    },
    {
      name: 'TRAFFIC',
      title: 'Traffic & Route Control',
      role: 'Corridor Ingress & Highway Rerouting',
      icon: Navigation,
      color: 'text-blue-400 bg-blue-950/50 border-blue-700',
    },
    {
      name: 'RESOURCE',
      title: 'Asset Logistics & Mutual Aid',
      role: 'Apparatus Staging & Mutual Aid Allocation',
      icon: Truck,
      color: 'text-teal-400 bg-teal-950/50 border-teal-700',
    },
    {
      name: 'COMMUNICATION',
      title: 'PIO & Command Communications',
      role: 'Public Safety Broadcasts & SITREP Drafting',
      icon: MessageSquare,
      color: 'text-cyan-400 bg-cyan-950/50 border-cyan-700',
    },
    {
      name: 'MONITOR',
      title: 'Dynamic Situation Monitor',
      role: 'Environmental Drift & Threat Escalation',
      icon: Activity,
      color: 'text-purple-400 bg-purple-950/50 border-purple-700',
    },
  ];

  const getResultForAgent = (name: string) => {
    return agentResults.find((r) => r.agentName.toUpperCase() === name.toUpperCase());
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">
            MULTI-AGENT COLLABORATION NETWORK
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            7 Active Agents
          </span>
        </div>

        {onTriggerAnalysis && (
          <button
            onClick={onTriggerAnalysis}
            disabled={isLoading}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold transition disabled:opacity-50"
          >
            {isLoading ? 'Agents Analyzing...' : 'Rerun Agent Pipeline'}
          </button>
        )}
      </div>

      {/* Grid of Agent Nodes */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {agentsConfig.map((agent) => {
          const Icon = agent.icon;
          const result = getResultForAgent(agent.name);
          const liveStatus = agentStatuses[agent.name] || (result ? result.status : 'IDLE');

          return (
            <div
              key={agent.name}
              className={`p-3.5 rounded-xl bg-slate-900/70 border transition hover:shadow-lg flex flex-col justify-between space-y-3 ${
                liveStatus === 'ANALYZING'
                  ? 'border-orange-500 animate-pulse'
                  : liveStatus === 'COMPLETED'
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/80 opacity-80'
              }`}
            >
              {/* Top Node Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg border ${agent.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{agent.title}</div>
                    <div className="text-[10px] text-slate-400">{agent.role}</div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                    liveStatus === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : liveStatus === 'ANALYZING'
                      ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {liveStatus}
                </span>
              </div>

              {/* Findings & Recommendations Snippet */}
              {result ? (
                <div className="space-y-2 text-[11px]">
                  {result.findings && result.findings[0] && (
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-900 text-slate-300">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Top Finding:</span>
                      {result.findings[0]}
                    </div>
                  )}

                  {result.recommendations && result.recommendations[0] && (
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-900 text-slate-300">
                      <span className="text-[10px] font-bold text-orange-400 uppercase block mb-0.5">Recommendation:</span>
                      {result.recommendations[0]}
                    </div>
                  )}

                  {result.urgencyScore && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Urgency Metric:</span>
                      <span className="font-mono font-bold text-amber-400">{result.urgencyScore}/10</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 text-[11px] italic bg-slate-950/40 rounded border border-slate-900">
                  Agent standing by for incident telemetry.
                </div>
              )}

              {/* Footer status line */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                <span>Moss Sync: Active</span>
                <span>Latency: ~180ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
