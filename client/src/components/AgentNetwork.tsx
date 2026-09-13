import React from 'react';
import {
  Shield,
  Activity,
  AlertCircle,
  Car,
  Truck,
  MessageSquare,
  Eye,
  Brain,
  MessageCircleQuestion,
  Layers
} from 'lucide-react';
import { MossAgentState, AgentName, AgentStateStatus } from '../types';

interface AgentNetworkProps {
  agentStates: MossAgentState[];
  onAskAgent: (agent: AgentName) => void;
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({ agentStates, onAskAgent }) => {
  const getAgentIcon = (agent: AgentName) => {
    switch (agent) {
      case 'COMMANDER':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'MEDICAL':
        return <Activity className="w-5 h-5 text-rose-400" />;
      case 'RESCUE':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'TRAFFIC':
        return <Car className="w-5 h-5 text-yellow-400" />;
      case 'RESOURCE':
        return <Truck className="w-5 h-5 text-purple-400" />;
      case 'COMMUNICATION':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'SITUATION':
        return <Eye className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: AgentStateStatus) => {
    switch (status) {
      case 'ANALYZING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            ANALYZING
          </span>
        );
      case 'REASSESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            REASSESSING
          </span>
        );
      case 'SYNTHESIZING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            SYNTHESIZING
          </span>
        );
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            COMPLETE
          </span>
        );
      case 'ASSIGNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            ASSIGNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            IDLE
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              MULTI-AGENT COLLABORATION NETWORK
            </h2>
            <p className="text-xs text-slate-400 m-0 p-0">
              Specialized agents executing against shared MOSS context in real-time
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded">
          7 SPECIALIZED AGENTS ONLINE
        </div>
      </div>

      {/* Grid of Agent State Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {agentStates.map((state) => {
          const isCommander = state.agent === 'COMMANDER';
          return (
            <div
              key={state.agent}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isCommander
                  ? 'bg-gradient-to-b from-cyan-950/30 to-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Agent Title & Status */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                      {getAgentIcon(state.agent)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-mono text-white tracking-wider m-0">
                        {state.agent} AGENT
                      </h4>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {isCommander ? 'Strategic Orchestrator' : 'Domain Specialist'}
                      </div>
                    </div>
                  </div>

                  <div>{getStatusBadge(state.status)}</div>
                </div>

                {/* Current Task */}
                <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">
                    CURRENT DIRECTIVE:
                  </span>
                  <p className="text-slate-200 leading-snug m-0">{state.currentTask}</p>
                </div>
              </div>

              {/* Context Retrieved & Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Context Retrieved:{' '}
                    <strong className="text-cyan-300 font-bold">{state.contextRetrieved || 6}</strong>
                  </span>
                </div>

                <button
                  onClick={() => onAskAgent(state.agent)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-600 border border-slate-700 text-slate-300 text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  title={`Ask ${state.agent} Agent a direct question`}
                >
                  <MessageCircleQuestion className="w-3 h-3" />
                  <span>Ask Agent</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
