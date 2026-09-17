'use client';

import React, { useState } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Brain,
  Shield,
  FileText,
  Radio,
  Compass,
  X,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation: () => void;
  onInjectEscalation: () => void;
  currentPlanVersion?: number;
  isLoading?: boolean;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onStartSimulation,
  onInjectEscalation,
  currentPlanVersion = 1,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e1422] border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                HACKATHON FLAGSHIP DEMONSTRATION SUITE
              </h2>
              <p className="text-[11px] text-slate-400">
                Highway Pileup • Moss Shared Context • Dynamic Replanning (v1 → v2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Visual Sequence Flow */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <div className="font-bold text-[10px] text-purple-400 uppercase tracking-wider">
              DEMONSTRATION TIMELINE WORKFLOW
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className={`px-2 py-1 rounded border ${currentStep >= 1 ? 'bg-purple-950 text-purple-300 border-purple-600' : 'bg-slate-900'}`}>
                1. Initial Crash
              </span>
              <span>→</span>
              <span className={`px-2 py-1 rounded border ${currentStep >= 2 ? 'bg-purple-950 text-purple-300 border-purple-600' : 'bg-slate-900'}`}>
                2. Moss Context & v1
              </span>
              <span>→</span>
              <span className={`px-2 py-1 rounded border ${currentStep >= 3 ? 'bg-purple-950 text-purple-300 border-purple-600' : 'bg-slate-900'}`}>
                3. Fire & Block Escalation
              </span>
              <span>→</span>
              <span className={`px-2 py-1 rounded border ${currentStep >= 4 ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-slate-900'}`}>
                4. Reassessment Plan v2
              </span>
            </div>
          </div>

          {/* Step 1: Initial Dispatch */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>PHASE 1: INITIAL DISPATCH & MOSS SYNCHRONIZATION</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">RG-2026-0001</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/50 p-2.5 rounded border border-slate-900">
              "Three vehicles have collided on a highway. Six people are reportedly involved. Two people may have serious injuries. One vehicle is smoking, and the highway is partially blocked."
            </p>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  onStartSimulation();
                  setCurrentStep(2);
                }}
                disabled={isLoading}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Reset & Initialize Initial Scenario</span>
              </button>
            </div>
          </div>

          {/* Step 2: Inject Escalation */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>PHASE 2: INJECT DYNAMIC ESCALATION (FIRE & LANE BLOCKAGE)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-bold border border-red-800">
                CRITICAL TRIGGER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/50 p-2.5 rounded border border-slate-900">
              "Fire is now reported in one vehicle, and the primary access lane is blocked."
            </p>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  onInjectEscalation();
                  setCurrentStep(4);
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-red-950/40"
              >
                <Flame className="w-4 h-4 text-amber-200" />
                <span>Inject Update & Trigger Reassessment</span>
              </button>
            </div>
          </div>

          {/* Judge Evaluation Criteria */}
          <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-800/60 space-y-2 text-[11px]">
            <div className="font-bold text-purple-300 uppercase tracking-wider text-[10px] flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5" />
              <span>WHAT THE HACKATHON JUDGES WILL OBSERVE:</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span><b>Moss Shared Context:</b> New incident report immediately appears with semantic metadata.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span><b>Collaborative Agents:</b> Medical, Rescue, Traffic, and Monitor agents analyze in parallel.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span><b>Dynamic Replanning:</b> Response Plan pivots from v1 to v2 with foam suppression & North corridor rerouting.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span><b>Human Approval:</b> Operator retains audit authority over tactical decisions.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            Current Response Plan: v{currentPlanVersion}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
