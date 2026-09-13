import React from 'react';
import { HelpCircle, X, Shield, Layers, AlertCircle, Clock } from 'lucide-react';
import { ExplainabilityItem } from '../types';

interface WhyExplainModalProps {
  item: ExplainabilityItem | null;
  onClose: () => void;
}

export const WhyExplainModal: React.FC<WhyExplainModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0d1322] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
              OPERATIONAL DECISION AUDIT
            </div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              EXPLAINABILITY: "WHY WAS THIS ACTION CHOSEN?"
            </h2>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Recommendation */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              DIRECTIVE RECOMMENDATION:
            </span>
            <div className="text-sm font-bold text-cyan-300">{item.recommendation}</div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Responsible Sector Agent: <strong className="text-white">[{item.responsibleAgent}]</strong>
            </div>
          </div>

          {/* Decision Summary */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              DECISION RATIONALE:
            </span>
            <p className="text-slate-200 leading-relaxed m-0 text-xs font-sans">
              {item.decisionSummary}
            </p>
          </div>

          {/* Information Considered */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              TELEMETRY & INFORMATION CONSIDERED:
            </span>
            <ul className="pl-4 list-disc space-y-1 text-slate-300 text-[11px] m-0">
              {item.informationConsidered.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>

          {/* Context Retrieved from MOSS */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono text-purple-400 uppercase block mb-1.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              MOSS SHARED CONTEXT REFERENCED:
            </span>
            <ul className="pl-4 list-disc space-y-1 text-purple-200 text-[11px] m-0">
              {item.contextRetrieved.map((ctx, idx) => (
                <li key={idx}>{ctx}</li>
              ))}
            </ul>
          </div>

          {/* Uncertainty & Timestamp */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Uncertainty Level: {item.uncertainty}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
