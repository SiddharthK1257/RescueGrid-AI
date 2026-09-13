import React from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, Activity, GitFork } from 'lucide-react';
import { ConflictItem } from '../types';

interface AgentConflictPanelProps {
  conflicts: ConflictItem[];
}

export const AgentConflictPanel: React.FC<AgentConflictPanelProps> = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-200">No Inter-Agent Conflicts Detected</h4>
            <p className="text-xs text-emerald-400/80">
              Specialized agent findings (Medical, Rescue, Traffic, Resource) are tactically aligned in MOSS shared context.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
          ALIGNED
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-amber-300">
            Multi-Agent Conflicts Detected & Resolved ({conflicts.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
          COMMANDER RESOLUTION ACTIVE
        </span>
      </div>

      <div className="grid gap-3">
        {conflicts.map((conflict, idx) => (
          <div
            key={conflict.id || idx}
            className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900/90 p-4 shadow-lg relative overflow-hidden"
          >
            {/* Top conflict bar */}
            <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">{conflict.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">AGENTS INVOLVED:</span>
                {conflict.agentsInvolved.map((agent) => (
                  <span
                    key={agent}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </div>

            {/* Conflict Flow: Problem -> Commander Analysis -> Resolution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
              {/* Problem Disagreement */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-rose-900/40">
                <div className="text-[11px] font-mono text-rose-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  CONFLICT DETECTED
                </div>
                <p className="text-slate-300 leading-relaxed">{conflict.description}</p>
              </div>

              {/* Commander Analysis */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-blue-900/40">
                <div className="text-[11px] font-mono text-blue-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  COMMANDER ANALYSIS
                </div>
                <p className="text-slate-300 leading-relaxed">{conflict.commanderAnalysis}</p>
              </div>

              {/* Resolution & Plan Update */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-emerald-900/40">
                <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  RESOLUTION & UPDATED PLAN
                </div>
                <p className="text-emerald-200 font-medium leading-relaxed">{conflict.resolution}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
