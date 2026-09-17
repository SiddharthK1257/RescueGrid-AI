'use client';

import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Brain,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  MapPin,
  PlayCircle,
  CheckCircle2,
  Lock,
  Compass
} from 'lucide-react';

interface LandingHeroProps {
  onEnterWorkspace: () => void;
  onOpenSimulation: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnterWorkspace,
  onOpenSimulation,
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#080c14] text-slate-100 p-6 md:p-12 flex flex-col items-center justify-center space-y-12">
      {/* Hero Header */}
      <div className="max-w-4xl text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-orange-950/60 border border-orange-800/80 text-orange-400 text-xs font-bold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hacking at HiDevs Hackathon • Multiplayer AI Track</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          RESCUEGRID <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">AI</span>
        </h1>

        <p className="text-xl sm:text-2xl font-semibold text-slate-300">
          One Emergency. Many AI Agents. <span className="text-purple-400">One Shared Context.</span>
        </p>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A collaborative multi-agent emergency response coordination platform where human operators
          and specialized AI agents synthesize real-time incident intelligence, maintain continuous memory
          through Moss, coordinate over LiveKit WebRTC, and adapt response plans dynamically.
        </p>

        {/* Hero Action CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnterWorkspace}
            className="px-6 py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl text-sm transition shadow-xl shadow-orange-950/50 flex items-center space-x-2"
          >
            <span>Launch Incident Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSimulation}
            className="px-6 py-3.5 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700 font-bold rounded-xl text-sm transition flex items-center space-x-2 shadow-lg"
          >
            <PlayCircle className="w-4 h-4 text-purple-400" />
            <span>Play Flagship Demo (Highway Crash)</span>
          </button>
        </div>
      </div>

      {/* Mandatory Tech Stack Cards */}
      <div className="w-full max-w-5xl space-y-4">
        <div className="text-center font-mono text-xs text-slate-500 uppercase tracking-widest font-semibold">
          MANDATORY TECHNOLOGY ARCHITECTURE
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-purple-600/60 transition">
            <div className="flex items-center space-x-2 text-purple-400 font-bold">
              <Brain className="w-4 h-4" />
              <span>1. MOSS</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Shared incident context, semantic retrieval & multi-agent persistent memory.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-cyan-600/60 transition">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Radio className="w-4 h-4" />
              <span>2. LIVEKIT</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time WebRTC voice rooms, collaborative sessions & secure temporary tokens.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-blue-600/60 transition">
            <div className="flex items-center space-x-2 text-blue-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>3. NEXT.JS</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Next.js 16 command-centre interface, dark tactical design & responsive layout.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-orange-600/60 transition">
            <div className="flex items-center space-x-2 text-orange-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>4. PYTHON & FASTAPI</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Commander agent, 6 specialized agents & concurrent asynchronous orchestration.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-amber-600/60 transition">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>5. GEMINI API</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous reasoning & structured JSON schema generation with domain fallback.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-teal-600/60 transition">
            <div className="flex items-center space-x-2 text-teal-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>6. MONGODB</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Persistent application records, versioned response plans & audit trails.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-red-600/60 transition">
            <div className="flex items-center space-x-2 text-red-400 font-bold">
              <Compass className="w-4 h-4" />
              <span>7. TACTICAL MAP</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Leaflet visualization with browser live location detection and permission gates.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 hover:border-emerald-600/60 transition">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>8. HUMAN-IN-THE-LOOP</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Full operator authority: plan approval, rejection, and verifiable auditability.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="max-w-2xl text-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
        RESCUEGRID AI is an emergency-coordination prototype. Recommendations are advisory and do not replace authorized emergency services or clinical medical diagnostics.
      </div>
    </div>
  );
};
