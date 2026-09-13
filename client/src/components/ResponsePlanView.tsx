import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  HelpCircle,
  Compass,
  AlertTriangle,
  HeartPulse,
  Radio,
  ArrowRight,
  GitCommit,
  Check,
  History,
  ShieldAlert
} from 'lucide-react';
import { ResponsePlan, ExplainabilityItem } from '../types';

interface ResponsePlanViewProps {
  plan: ResponsePlan | null;
  allPlans: ResponsePlan[];
  onApprove: (planId: string) => void;
  onReject: (planId: string) => void;
  onRequestReassessment: (content: string) => void;
  onSelectWhy: (item: ExplainabilityItem) => void;
}

export const ResponsePlanView: React.FC<ResponsePlanViewProps> = ({
  plan,
  allPlans,
  onApprove,
  onReject,
  onRequestReassessment,
  onSelectWhy
}) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [reassessmentNote, setReassessmentNote] = useState('');
  const [showReassessBox, setShowReassessBox] = useState(false);

  if (!plan) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 font-mono text-xs">
        Synthesizing initial collaborative response plan...
      </div>
    );
  }

  const activePlan = selectedVersion
    ? allPlans.find((p) => p.version === selectedVersion) || plan
    : plan;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-5 shadow-xl space-y-5">
      {/* Plan Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
                  COLLABORATIVE RESPONSE PLAN
                </h2>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
                  VERSION {activePlan.version}.0
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                    activePlan.approvalStatus === 'APPROVED'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : activePlan.approvalStatus === 'REJECTED'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {activePlan.approvalStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0 mt-0.5 font-mono">
                Formulated by Commander Agent with synthesized MOSS context • Created at{' '}
                {new Date(activePlan.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Version History Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">VERSION HISTORY:</span>
          <div className="flex items-center gap-1">
            {allPlans.map((p) => (
              <button
                key={p.version}
                onClick={() => setSelectedVersion(p.version)}
                className={`px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors border ${
                  activePlan.version === p.version
                    ? 'bg-cyan-500 text-black font-bold border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                v{p.version}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Changes / Diff Banner (if revised plan) */}
      {activePlan.changeLog && activePlan.changeLog.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-mono font-bold uppercase mb-1.5">
            <GitCommit className="w-4 h-4 text-purple-400" />
            <span>MOSS Context Reassessment Changes (vs previous version):</span>
          </div>
          <ul className="space-y-1 pl-4 list-disc text-purple-200">
            {activePlan.changeLog.map((change, cIdx) => (
              <li key={cIdx}>{change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Operational Summary */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
          OPERATIONAL DIRECTIVE SUMMARY
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed m-0 font-sans">
          {activePlan.summary}
        </p>
      </div>

      {/* Strategic Priorities & Immediate Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Ranked Priorities */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            RANKED STRATEGIC PRIORITIES
          </h3>
          <ol className="space-y-2 pl-0 list-none m-0">
            {activePlan.priorities.map((p, idx) => (
              <li
                key={idx}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Immediate Actions Checklist */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            IMMEDIATE ACTION PROTOCOLS
          </h3>
          <ul className="space-y-2 pl-0 list-none m-0">
            {activePlan.immediateActions.map((action, idx) => (
              <li
                key={idx}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 flex items-start gap-2.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Responder Sector Assignments & Route Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Responder Assignments */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            TACTICAL APPARATUS ASSIGNMENTS
          </h3>
          <div className="space-y-2">
            {activePlan.responderAssignments.map((assignment, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-white text-xs">{assignment.unit}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{assignment.task}</div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      assignment.priority === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {assignment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Constraints & Detours */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-yellow-400" />
            CORRIDOR ACCESS & TRAFFIC CONSTRAINTS
          </h3>
          <div className="space-y-2.5">
            <div
              className={`p-2.5 rounded-lg border text-xs ${
                activePlan.accessRoutes.primaryBlocked
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              }`}
            >
              <div className="font-mono font-bold uppercase text-[11px] mb-1">
                {activePlan.accessRoutes.primaryBlocked ? '⛔ PRIMARY ROUTE BLOCKED' : '✅ PRIMARY ROUTE OPEN'}
              </div>
              <p className="m-0 text-[11px] leading-relaxed">
                {activePlan.accessRoutes.primaryBlockedReason || 'Clear access along primary transit line.'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]">
              <span className="font-mono text-cyan-400 font-bold block mb-1">
                DESIGNATED ALTERNATE DETOUR:
              </span>
              <p className="text-white font-medium m-0">{activePlan.accessRoutes.alternateRoute}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Strategy & Public Alert Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Medical Strategy */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            MEDICAL TRIAGE & PROTOCOL
          </h3>
          <p className="text-slate-300 leading-relaxed text-xs m-0 mb-2">
            {activePlan.medicalStrategy.triageSummary}
          </p>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 italic">
            🛡️ {activePlan.medicalStrategy.disclaimer}
          </div>
        </div>

        {/* Public Alert */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue-400" />
            PUBLIC EMERGENCY BROADCAST
          </h3>
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs leading-relaxed font-mono">
            {activePlan.publicSafetyAlert}
          </div>
        </div>
      </div>

      {/* "Why?" Explainability Cards Section */}
      {activePlan.whyExplanations && activePlan.whyExplanations.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider m-0">
                DECISION EXPLAINABILITY ("WHY?")
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Audit-grounded operational rationales
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePlan.whyExplanations.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onSelectWhy(item)}
                className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 mb-1">
                    <span>AGENT: {item.responsibleAgent}</span>
                    <span className="text-slate-500">Click to Inspect</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mb-1 leading-snug">
                    {item.recommendation}
                  </div>
                  <p className="text-[11px] text-slate-400 m-0 line-clamp-2">
                    {item.decisionSummary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Operator Override Controls */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">HUMAN OPERATOR DECISION:</span>
          {activePlan.approvedBy && (
            <span className="text-xs font-mono text-emerald-400 font-bold">
              [Approved by {activePlan.approvedBy}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onApprove(activePlan.planId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>APPROVE PLAN</span>
          </button>

          <button
            onClick={() => onReject(activePlan.planId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 text-xs font-bold transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>REJECT</span>
          </button>

          <button
            onClick={() => setShowReassessBox(!showReassessBox)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/60 text-purple-300 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REQUEST REASSESSMENT</span>
          </button>
        </div>
      </div>

      {/* Reassessment input box */}
      {showReassessBox && (
        <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-700/50 space-y-2 mt-2">
          <label className="text-xs font-mono text-purple-300 font-bold block">
            Provide Reassessment Guidance for Commander & Agents:
          </label>
          <input
            type="text"
            value={reassessmentNote}
            onChange={(e) => setReassessmentNote(e.target.value)}
            placeholder="e.g. Focus on air ambulance extraction or secondary bridge access..."
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                onRequestReassessment(reassessmentNote);
                setShowReassessBox(false);
                setReassessmentNote('');
              }}
              className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
            >
              Submit Directive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
