'use client';

import React, { useState } from 'react';
import { MossContextItem } from '../types';
import {
  Brain,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface MossContextPanelProps {
  items: MossContextItem[];
  isDemoFallback?: boolean;
}

export const MossContextPanel: React.FC<MossContextPanelProps> = ({
  items,
  isDemoFallback = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.contributingAgent && item.contributingAgent.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource =
      selectedSource === 'ALL' || item.source === selectedSource;

    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'HUMAN_VERIFIED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'AI_GENERATED':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'USER_REPORTED':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'SIMULATED':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">
            MOSS SHARED CONTEXT & MEMORY
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900/40 text-purple-300 border border-purple-800">
            {items.length} items
          </span>
        </div>

        {/* MOSS Mode Badge */}
        <div className="flex items-center space-x-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border flex items-center space-x-1 ${
              isDemoFallback
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{isDemoFallback ? 'LOCAL DEMO CONTEXT' : 'REMOTE MOSS CONNECTED'}</span>
          </span>
        </div>
      </div>

      {/* Semantic Search & Filter Bar */}
      <div className="p-3 bg-slate-900/50 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Semantic retrieval across all agent memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {['ALL', 'USER_REPORTED', 'AI_GENERATED', 'HUMAN_VERIFIED', 'SIMULATED'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-2 py-0.5 rounded transition font-medium ${
                selectedSource === src
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {src.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Context Stream List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No context items match the query.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.contextId}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded border font-semibold ${getSourceBadge(item.source)}`}>
                    {item.source}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {item.type}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-200 leading-snug">
                {item.summary}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-900/80 leading-relaxed font-sans">
                {item.content}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="flex items-center space-x-1 text-purple-400">
                  <Cpu className="w-3 h-3" />
                  <span>Agent: <b>{item.contributingAgent || 'System'}</b></span>
                </span>
                <span className="flex items-center space-x-1 text-slate-500">
                  <span>v{item.version}</span>
                  <span>•</span>
                  <span>Conf: {Math.round(item.confidence * 100)}%</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center space-x-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>Shared context persists across all 6 specialized agents & Commander.</span>
        </span>
      </div>
    </div>
  );
};
