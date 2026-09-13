import React, { useState } from 'react';
import { Clock, Shield, User, Brain, Terminal, Download, Filter, CheckCircle2 } from 'lucide-react';
import { AuditLog, IncidentUpdate } from '../types';

interface AuditTimelineProps {
  auditLogs: AuditLog[];
  updates: IncidentUpdate[];
  incidentId: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ auditLogs, updates, incidentId }) => {
  const [filterActor, setFilterActor] = useState<string>('ALL');

  const filteredLogs = filterActor === 'ALL'
    ? auditLogs
    : auditLogs.filter((l) => l.actorType === filterActor);

  const handleExportSession = () => {
    const sessionData = {
      incidentId,
      exportedAt: new Date().toISOString(),
      auditLogs,
      updates
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rescuegrid-session-${incidentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActorBadge = (type: string, actor: string) => {
    switch (type) {
      case 'HUMAN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 font-bold">
            <User className="w-3 h-3" />
            {actor}
          </span>
        );
      case 'AGENT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-bold">
            <Shield className="w-3 h-3" />
            {actor} AGENT
          </span>
        );
      case 'MOSS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-300 font-bold">
            <Brain className="w-3 h-3" />
            MOSS CONTEXT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            <Terminal className="w-3 h-3" />
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              AUDIT TRAIL & LONG-RUNNING SESSION TIMELINE
            </h2>
            <p className="text-xs text-slate-400 m-0 p-0">
              Tamper-evident record of all human interventions, MOSS context stores, and agent decisions
            </p>
          </div>
        </div>

        <button
          onClick={handleExportSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer self-start sm:self-auto"
          title="Export complete session JSON for persistent incident replay"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Session JSON</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">FILTER ACTOR:</span>
        {['ALL', 'HUMAN', 'AGENT', 'MOSS', 'SYSTEM'].map((actor) => (
          <button
            key={actor}
            onClick={() => setFilterActor(actor)}
            className={`px-2.5 py-0.5 rounded border text-[11px] cursor-pointer transition-colors ${
              filterActor === actor
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {actor}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No audit records matching current actor filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.logId}
              className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getActorBadge(log.actorType, log.actor)}
                  <span className="font-mono font-bold text-white text-[11px]">{log.action}</span>
                </div>
                <p className="text-slate-300 leading-snug m-0 text-[11px] font-sans pl-1">
                  {log.details}
                </p>
              </div>

              <div className="text-[10px] font-mono text-slate-500 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
