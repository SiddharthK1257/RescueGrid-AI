import React, { useState } from 'react';
import { MessageSquare, Radio, Copy, Check, Megaphone, FileText, Send } from 'lucide-react';
import { ResponsePlan } from '../types';

interface CommunicationBriefingProps {
  plan: ResponsePlan | null;
}

export const CommunicationBriefing: React.FC<CommunicationBriefingProps> = ({ plan }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!plan) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 font-mono text-xs">
        Generating operational communications...
      </div>
    );
  }

  const responderBriefing = `TACTICAL BRIEFING [Incident ${plan.incidentId} | Plan v${plan.version}]:\n` +
    `SUMMARY: ${plan.summary}\n` +
    `ACCESS: ${plan.accessRoutes.primaryBlocked ? `Primary corridor BLOCKED (${plan.accessRoutes.primaryBlockedReason}). ROUTE VIA: ${plan.accessRoutes.alternateRoute}` : 'Primary corridor OPEN.'}\n` +
    `PRIORITIES:\n${plan.priorities.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}\n` +
    `IMMEDIATE ACTIONS:\n${plan.immediateActions.map((a) => `  - ${a}`).join('\n')}\n` +
    `MEDICAL TRIAGE: ${plan.medicalStrategy.urgencyLevel} - ${plan.medicalStrategy.triageSummary}`;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              OPERATIONAL COMMUNICATIONS & BROADCASTS
            </h2>
            <p className="text-xs text-slate-400 m-0 p-0">
              Synthesized by Communication Agent from MOSS shared context
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-500/30 px-2.5 py-1 rounded self-start sm:self-auto">
          COMMUNICATION AGENT V1
        </span>
      </div>

      {/* Public Emergency Alert Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/40 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-blue-900/40">
          <div className="flex items-center gap-2 text-blue-300 font-mono text-xs font-bold uppercase">
            <Megaphone className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>PUBLIC SAFETY EMERGENCY BROADCAST (EAS)</span>
          </div>
          <button
            onClick={() => handleCopy(plan.publicSafetyAlert, 'alert')}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-blue-900/40 hover:bg-blue-900/70 border border-blue-700/60 text-blue-200 transition-colors cursor-pointer"
          >
            {copiedSection === 'alert' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSection === 'alert' ? 'Copied' : 'Copy Alert'}</span>
          </button>
        </div>
        <p className="text-sm text-blue-100 leading-relaxed font-mono m-0">
          {plan.publicSafetyAlert}
        </p>
      </div>

      {/* Tactical Responder Briefing */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>FIELD RESPONDER TACTICAL BRIEFING</span>
          </div>
          <button
            onClick={() => handleCopy(responderBriefing, 'briefing')}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {copiedSection === 'briefing' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSection === 'briefing' ? 'Copied' : 'Copy Full Brief'}</span>
          </button>
        </div>
        <pre className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed overflow-x-auto m-0">
          {responderBriefing}
        </pre>
      </div>
    </div>
  );
};
