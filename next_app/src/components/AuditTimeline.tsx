'use client';

import React from 'react';
import { AuditLog } from '../types';
import { Clock, Shield, UserCheck, Cpu, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  const getActorBadge = (actor: string) => {
    if (actor.startsWith('HUMAN')) {
      return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
    if (actor.startsWith('AGENT:COMMANDER')) {
      return 'bg-orange-950 text-orange-300 border-orange-800';
    }
    if (actor.startsWith('AGENT')) {
      return 'bg-blue-950 text-blue-300 border-blue-800';
    }
    return 'bg-purple-950 text-purple-300 border-purple-800';
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">
            IMMUTABLE INCIDENT AUDIT TRAIL & TIMELINE
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {logs.length} Events
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No audit records logged yet.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.logId}
              className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs"
            >
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shrink-0 text-slate-400">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActorBadge(log.actor)}`}>
                      {log.actor}
                    </span>
                    <span className="font-mono text-slate-300 font-semibold">{log.action}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {log.summary}
                </p>

                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Log ID: {log.logId}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
