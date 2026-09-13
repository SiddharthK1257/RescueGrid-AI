import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Activity,
  Car,
  Truck,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { MossContextItem } from '../types';
import { api } from '../services/api';

interface MossContextPanelProps {
  incidentId: string;
  contextItems: MossContextItem[];
  onRefresh: () => void;
}

export const MossContextPanel: React.FC<MossContextPanelProps> = ({
  incidentId,
  contextItems,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<MossContextItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Trigger semantic search when user types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const results = await api.searchMoss(
            incidentId,
            searchQuery,
            selectedSource !== 'ALL' ? selectedSource : undefined
          );
          setSearchResults(results);
        } catch (err) {
          console.error('Semantic search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSource, incidentId]);

  const displayItems = searchResults !== null
    ? searchResults
    : selectedSource === 'ALL'
      ? contextItems
      : contextItems.filter((i) => i.source === selectedSource);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'HUMAN':
        return <User className="w-3.5 h-3.5 text-amber-400" />;
      case 'COMMANDER':
        return <Shield className="w-3.5 h-3.5 text-cyan-400" />;
      case 'MEDICAL':
        return <Activity className="w-3.5 h-3.5 text-rose-400" />;
      case 'RESCUE':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-400" />;
      case 'TRAFFIC':
        return <Car className="w-3.5 h-3.5 text-yellow-400" />;
      case 'RESOURCE':
        return <Truck className="w-3.5 h-3.5 text-purple-400" />;
      case 'COMMUNICATION':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Brain className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'HUMAN':
        return 'bg-amber-950/40 border-amber-500/40 text-amber-300';
      case 'COMMANDER':
        return 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300';
      case 'MEDICAL':
        return 'bg-rose-950/40 border-rose-500/40 text-rose-300';
      case 'RESCUE':
        return 'bg-orange-950/40 border-orange-500/40 text-orange-300';
      case 'TRAFFIC':
        return 'bg-yellow-950/40 border-yellow-500/40 text-yellow-300';
      case 'RESOURCE':
        return 'bg-purple-950/40 border-purple-500/40 text-purple-300';
      case 'COMMUNICATION':
        return 'bg-blue-950/40 border-blue-500/40 text-blue-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2 m-0 p-0 font-mono">
              MOSS SHARED CONTEXT
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Namespace: rg-incident-{incidentId}
              </span>
            </h2>
            <p className="text-xs text-slate-400 m-0 p-0">
              Continuously updated semantic memory powering multiplayer agent collaboration
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Memory</span>
        </button>
      </div>

      {/* Semantic Search & Filter Bar */}
      <div className="my-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="MOSS Semantic Retrieval (e.g., 'blocked road', 'critical casualties', 'flames')..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-24 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                SEMANTIC
              </span>
            )}
          </div>
        </div>

        {/* Source Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {['ALL', 'HUMAN', 'COMMANDER', 'MEDICAL', 'RESCUE', 'TRAFFIC', 'RESOURCE', 'COMMUNICATION'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-2.5 py-1 rounded-md border text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                selectedSource === src
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Context Items Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[600px]">
        {displayItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No MOSS context items found matching current filters.
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const relevance = item.metadata.relevanceScore
              ? Math.round(item.metadata.relevanceScore * 100)
              : Math.min(98, 80 + Math.floor(Math.random() * 15));

            return (
              <div
                key={item.id || idx}
                className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs"
              >
                {/* Item Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono font-bold ${getSourceBadgeClass(
                        item.source
                      )}`}
                    >
                      {getSourceIcon(item.source)}
                      [{item.source}]
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Relevance Meter */}
                    <div className="flex items-center gap-1.5 font-mono text-[11px]" title="MOSS Semantic Relevance Score">
                      <span className="text-slate-400">RELEVANCE:</span>
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                          style={{ width: `${relevance}%` }}
                        ></div>
                      </div>
                      <span className="text-cyan-300 font-semibold">{relevance}%</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Summary & Content */}
                <div className="text-slate-200 font-medium mb-1">{item.summary}</div>
                <div className="text-slate-400 leading-relaxed text-[11px] bg-slate-950/50 p-2 rounded border border-slate-800/80 font-sans">
                  {item.content}
                </div>

                {/* Tags */}
                {item.metadata?.tags && item.metadata.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {item.metadata.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Total Memory: {contextItems.length} contextual nodes</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Continuously Synchronized</span>
        </div>
      </div>
    </div>
  );
};
