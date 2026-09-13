import React, { useState } from 'react';
import {
  Zap,
  Flame,
  CloudRain,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';

interface InjectUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (content: string, author: string) => Promise<void>;
}

export const InjectUpdateModal: React.FC<InjectUpdateModalProps> = ({
  isOpen,
  onClose,
  onInject
}) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('Lead Incident Commander');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const presets = [
    {
      title: '🔥 Flagship Step 9: Fire & Hard Road Closure',
      text: 'Fire is now reported in one vehicle and the primary access lane is blocked.',
      icon: Flame,
      category: 'HIGHWAY FLAGSHIP DEMO'
    },
    {
      title: '🌧️ Heavy Rain & Shoulder Fuel Ignition',
      text: 'Heavy rain has started and fuel leakage has ignited on the right shoulder.',
      icon: CloudRain,
      category: 'ENVIRONMENTAL EVOLUTION'
    },
    {
      title: '🚑 Additional Entrapped Casualties',
      text: 'Two additional injured people have been reported trapped in the third vehicle.',
      icon: Users,
      category: 'CASUALTY ESCALATION'
    },
    {
      title: '🚓 Police Exit 14 Full Diversion',
      text: 'Confirmed. Police have completely blocked the highway at Exit 14. All traffic diverted to North Bypass.',
      icon: ShieldAlert,
      category: 'ROUTE ACCESS'
    }
  ];

  const handleSubmit = async (textToInject?: string) => {
    const finalContent = textToInject || content;
    if (!finalContent.trim()) return;

    setIsSubmitting(true);
    setStepIndex(1);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < 5 ? prev + 1 : prev));
    }, 450);

    try {
      await onInject(finalContent, author);
      clearInterval(interval);
      setStepIndex(5);
      setTimeout(() => {
        setIsSubmitting(false);
        setContent('');
        setStepIndex(0);
        onClose();
      }, 700);
    } catch (err) {
      clearInterval(interval);
      setIsSubmitting(false);
      setStepIndex(0);
      alert('Failed to inject update. Check connection.');
    }
  };

  const steps = [
    'NEW INFORMATION INJECTED',
    'MOSS CONTEXT STORED & SCORED',
    'AFFECTED AGENTS RETRIEVE CONTEXT',
    'PARALLEL SECTOR REASSESSMENT',
    'COMMANDER SYNTHESIS & CONFLICT RESOLUTION',
    'REVISED RESPONSE PLAN PUBLISHED'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0d1322] shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide font-mono m-0 p-0 flex items-center gap-2">
              + INJECT NEW INCIDENT INFORMATION
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Updates MOSS shared context, reactivates specialized agents, and generates a revised response plan
            </p>
          </div>
        </div>

        {/* Real-Time Collaborative Pipeline Indicator */}
        <div className="my-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[10px]">
          <div className="text-slate-400 font-bold uppercase mb-2 flex items-center justify-between">
            <span>AUTOMATED COLLABORATIVE FLOW:</span>
            {isSubmitting && (
              <span className="text-cyan-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                STAGE {stepIndex + 1} OF 6
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-1.5 rounded border transition-all flex items-center gap-1.5 ${
                  isSubmitting && stepIndex >= idx
                    ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Presets for Demo */}
        <div className="mb-4 space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            HIGH-IMPACT TELEMETRY PRESETS:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                disabled={isSubmitting}
                onClick={() => {
                  setContent(preset.text);
                  handleSubmit(preset.text);
                }}
                className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <preset.icon className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" />
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white font-mono">
                    {preset.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 group-hover:text-slate-300 line-clamp-2 m-0">
                  "{preset.text}"
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <label className="font-bold text-slate-300 uppercase">
              OR ENTER CUSTOM INCIDENT TELEMETRY:
            </label>
            <div className="flex items-center gap-1 text-slate-400">
              <span>Author:</span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
              />
            </div>
          </div>

          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Fire is now reported in one vehicle and the primary access lane is blocked..."
            className="w-full bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-cyan-950 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>REASSESSING PIPELINE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>INJECT & REASSESS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
