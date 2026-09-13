import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  Car,
  Flame,
  Waves,
  Train,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  X,
  Play
} from 'lucide-react';
import { api } from '../services/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioLoaded: (incidentId: string) => void;
  onInjectUpdate: (content: string, author: string) => Promise<void>;
  activeIncidentId?: string;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onScenarioLoaded,
  onInjectUpdate,
  activeIncidentId
}) => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [flagshipStep, setFlagshipStep] = useState<number>(1);
  const [executingStep, setExecutingStep] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getScenarios().then(setScenarios).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadScenario = async (scenarioId: string) => {
    setLoadingId(scenarioId);
    try {
      const res = await api.loadScenario(scenarioId);
      if (res.success && res.incident) {
        onScenarioLoaded(res.incident.incidentId);
        onClose();
      }
    } catch (err) {
      console.error('Error loading scenario:', err);
      alert('Failed to load scenario.');
    } finally {
      setLoadingId(null);
    }
  };

  const executeFlagshipStep9 = async () => {
    setExecutingStep(true);
    try {
      await onInjectUpdate(
        'Fire is now reported in one vehicle and the primary access lane is blocked.',
        'Human Operator'
      );
      setFlagshipStep(15);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingStep(false);
    }
  };

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'highway-accident':
        return <Car className="w-6 h-6 text-rose-400" />;
      case 'building-fire':
        return <Flame className="w-6 h-6 text-amber-400" />;
      case 'urban-flood':
        return <Waves className="w-6 h-6 text-cyan-400" />;
      case 'train-collision':
        return <Train className="w-6 h-6 text-purple-400" />;
      case 'stadium-evacuation':
        return <Users className="w-6 h-6 text-emerald-400" />;
      default:
        return <PlayCircle className="w-6 h-6 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#0d1322] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide font-mono m-0 p-0">
              EMERGENCY SIMULATION & FLAGSHIP DEMO
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Launch real incident records, execute the live multi-agent collaborative pipeline, and test MOSS context reassessments
            </p>
          </div>
        </div>

        {/* Flagship Demo Interactive Walkthrough Box */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-cyan-900/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                FLAGSHIP HACKATHON DEMO: HIGHWAY COLLISION (RG-2026-0001)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              RECOMMENDED FOR JUDGES
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Demonstrates the complete end-to-end flow: Initial Report → MOSS Shared Memory → Commander → Specialized Agents (Parallel) → Response Plan v1 → <strong>Step 9: Inject Fire & Road Closure</strong> → MOSS Updated → Agents Reassess → Response Plan v2 Diff!
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadScenario('highway-accident')}
              disabled={loadingId === 'highway-accident'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950 cursor-pointer"
            >
              {loadingId === 'highway-accident' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>1. LOAD & RESET FLAGSHIP BASELINE (v1)</span>
            </button>

            <button
              onClick={executeFlagshipStep9}
              disabled={executingStep}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-rose-950 cursor-pointer"
            >
              {executingStep ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>2. TRIGGER STEP 9: INJECT FIRE & ROAD BLOCK</span>
            </button>
          </div>
        </div>

        {/* All Scenarios Grid */}
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase mb-3">
            ALL PRESET EMERGENCY SCENARIOS ({scenarios.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                        {getScenarioIcon(sc.id)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono leading-snug m-0">
                          {sc.name}
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {sc.category} • Severity: {sc.incident.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-3 font-sans">
                    {sc.incident.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {sc.incident.incidentId}
                  </span>
                  <button
                    onClick={() => handleLoadScenario(sc.id)}
                    disabled={loadingId === sc.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500 border border-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    {loadingId === sc.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                    <span>Load Scenario</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
