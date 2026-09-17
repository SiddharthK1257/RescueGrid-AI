'use client';

import React from 'react';
import { Settings, X, Server, Brain, Radio, Database, ShieldCheck, MapPin } from 'lucide-react';
import { SystemHealth } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemHealth: SystemHealth | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  systemHealth
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e1422] border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-slate-300" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              SYSTEM CONFIGURATION & SERVICE DIAGNOSTICS
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          <div className="space-y-3">
            {/* FastAPI Backend */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Python FastAPI Backend</div>
                  <div className="text-[11px] text-slate-400">Endpoint: http://localhost:8000/api</div>
                  <div className="text-[10px] text-slate-500">Autonomous Orchestrator & 7 Specialized Agents</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                HEALTHY
              </span>
            </div>

            {/* Moss Shared Memory */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Moss Shared Context Layer</div>
                  <div className="text-[11px] text-slate-400">
                    Mode: {systemHealth?.services?.mossSharedContext?.mode || 'LOCAL_DEMO_CONTEXT'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Multi-Agent Shared Memory, Semantic Retrieval & Versioning
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                ACTIVE
              </span>
            </div>

            {/* LiveKit Voice */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Radio className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">LiveKit WebRTC Collaboration</div>
                  <div className="text-[11px] text-slate-400">
                    URL: {systemHealth?.services?.livekitCollaboration?.url || 'wss://rescuegrid.livekit.cloud'}
                  </div>
                  <div className="text-[10px] text-slate-500">Server-Side JWT Token Generation & Voice Room</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                ONLINE
              </span>
            </div>

            {/* Gemini AI Reasoning */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Google Gemini AI Reasoning</div>
                  <div className="text-[11px] text-slate-400">
                    Model: {systemHealth?.services?.geminiAiReasoning?.mode || 'GEMINI_2.5_FLASH'}
                  </div>
                  <div className="text-[10px] text-slate-500">Structured JSON Output & Domain Emergency Engine</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                OPERATIONAL
              </span>
            </div>

            {/* MongoDB Datastore */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-teal-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">MongoDB Persistence</div>
                  <div className="text-[11px] text-slate-400">
                    Status: {systemHealth?.services?.mongoDbPersistence?.status || 'CONNECTED'}
                  </div>
                  <div className="text-[10px] text-slate-500">Incident History, Audit Logs, and Location Telemetry</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                PERSISTENT
              </span>
            </div>

            {/* Interactive Map Service */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Interactive Map & Geolocation</div>
                  <div className="text-[11px] text-slate-400">Provider: OpenStreetMap / Leaflet</div>
                  <div className="text-[10px] text-slate-500">Browser GPS Live Location & Simulated Emergency Pins</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                READY
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            <b>Safety Boundary Disclaimer:</b> RESCUEGRID AI is an emergency-coordination prototype.
            AI recommendations are advisory and do not replace authorized emergency services or official 911 dispatch.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
