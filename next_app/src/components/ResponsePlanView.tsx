'use client';

import React, { useState } from 'react';
import { ResponsePlan } from '../types';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  HelpCircle,
  ChevronRight,
  History,
  Send
} from 'lucide-react';

interface ResponsePlanViewProps {
  currentPlan: ResponsePlan | null;
  allPlans: ResponsePlan[];
  onApprove: (approved: boolean, notes?: string) => void;
  isLoading?: boolean;
}

export const ResponsePlanView: React.FC<ResponsePlanViewProps> = ({
  currentPlan,
  allPlans,
  onApprove,
  isLoading = false
}) => {
  const [selectedPlanVersion, setSelectedPlanVersion] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const activeDisplayPlan =
    selectedPlanVersion !== null
      ? allPlans.find((p) => p.version === selectedPlanVersion) || currentPlan
      : currentPlan;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'HIGH':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'MEDIUM':
        return 'bg-blue-950 text-blue-300 border-blue-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'REJECTED':
        return 'bg-red-950 text-red-300 border-red-700';
      default:
        return 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse';
    }
  };

  if (!activeDisplayPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0e1422] rounded-xl border border-slate-800 text-slate-400 text-xs text-center space-y-2">
        <FileText className="w-8 h-8 text-slate-600" />
        <p className="font-semibold text-slate-300">No Response Plan Generated Yet</p>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Trigger the multi-agent pipeline or inject a scenario to generate an explainable response plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">
            COMMANDER RESPONSE PLAN
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-700">
            v{activeDisplayPlan.version}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(activeDisplayPlan.status)}`}>
            {activeDisplayPlan.status}
          </span>
        </div>

        {/* Plan Version Selector */}
        {allPlans.length > 1 && (
          <div className="flex items-center space-x-1 text-xs">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeDisplayPlan.version}
              onChange={(e) => setSelectedPlanVersion(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5 focus:outline-none"
            >
              {allPlans.map((p) => (
                <option key={p.planId} value={p.version}>
                  Plan v{p.version} ({p.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Plan Details Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Primary Objective */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/90 space-y-1">
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
            PRIMARY TACTICAL OBJECTIVE
          </div>
          <div className="text-sm font-bold text-slate-100">
            {activeDisplayPlan.primaryObjective || 'Corridor containment & stabilization'}
          </div>
        </div>

        {/* Commander Rationale */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/90 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            COMMANDER SYNTHESIS & RATIONALE
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            {activeDisplayPlan.rationale}
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>SYNTHESIZED TACTICAL ACTIONS ({activeDisplayPlan.actions.length})</span>
            <span className="text-[10px] text-slate-500">Subject to Human Approval</span>
          </div>

          <div className="space-y-2">
            {activeDisplayPlan.actions.map((action, idx) => (
              <div
                key={action.id || idx}
                className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                    <span className="font-semibold text-slate-200">{action.title}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                      {action.agent}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityBadge(action.priority)}`}>
                      {action.priority}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  {action.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pl-5 pt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Est: {action.estimatedTime || '3-5 min'}</span>
                  </span>
                  {action.requiresApproval && (
                    <span className="text-amber-400 font-medium">Requires Human Verification</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uncertainties Section */}
        {activeDisplayPlan.uncertainties && activeDisplayPlan.uncertainties.length > 0 && (
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/90 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>AREAS OF OPERATIONAL UNCERTAINTY</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
              {activeDisplayPlan.uncertainties.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Human Approval Controls (Bottom Action Bar) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        {showNotesInput && (
          <div className="space-y-1">
            <textarea
              placeholder="Add operator notes or special verification instructions..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full h-16 p-2 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowNotesInput(!showNotesInput)}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            {showNotesInput ? 'Hide Notes' : '+ Add Operator Notes'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onApprove(false, approvalNotes)}
              disabled={isLoading || activeDisplayPlan.status === 'REJECTED'}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700 rounded text-xs font-semibold transition disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Plan</span>
            </button>

            <button
              onClick={() => onApprove(true, approvalNotes)}
              disabled={isLoading || activeDisplayPlan.status === 'APPROVED'}
              className="flex items-center space-x-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{activeDisplayPlan.status === 'APPROVED' ? 'Approved' : 'Approve Plan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
