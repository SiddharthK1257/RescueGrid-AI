'use client';

import React, { useState } from 'react';
import {
  Incident,
  MapMarker,
  MossContextItem,
  AgentResult,
  ResponsePlan,
  AuditLog,
  LocationRecord
} from '../types';
import { EmergencyMap } from './EmergencyMap';
import { MossContextPanel } from './MossContextPanel';
import { ResponsePlanView } from './ResponsePlanView';
import { LiveKitRoom } from './LiveKitRoom';
import { AgentNetwork } from './AgentNetwork';
import {
  AlertTriangle,
  Flame,
  Plus,
  Radio,
  Send,
  Sparkles,
  Shield,
  Activity,
  History,
  CheckCircle,
  FileText,
  Users,
  Compass
} from 'lucide-react';

interface IncidentWorkspaceProps {
  incidents: Incident[];
  activeIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onNewIncidentClick: () => void;
  markers: MapMarker[];
  contextItems: MossContextItem[];
  agentResults: AgentResult[];
  latestPlan: ResponsePlan | null;
  allPlans: ResponsePlan[];
  timeline: AuditLog[];
  onApprovePlan: (approved: boolean, notes?: string) => void;
  onInjectUpdate: (content: string) => void;
  onTriggerAnalysis: () => void;
  onLocationRecorded: (loc: Partial<LocationRecord>) => void;
  isLoading?: boolean;
}

export const IncidentWorkspace: React.FC<IncidentWorkspaceProps> = ({
  incidents,
  activeIncident,
  onSelectIncident,
  onNewIncidentClick,
  markers,
  contextItems,
  agentResults,
  latestPlan,
  allPlans,
  timeline,
  onApprovePlan,
  onInjectUpdate,
  onTriggerAnalysis,
  onLocationRecorded,
  isLoading = false
}) => {
  const [rightPanelTab, setRightPanelTab] = useState<'PLAN' | 'MOSS' | 'AGENTS' | 'LIVEKIT'>('PLAN');
  const [injectedText, setInjectedText] = useState('');

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!injectedText.trim()) return;
    onInjectUpdate(injectedText.trim());
    setInjectedText('');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#080c14] text-slate-200 overflow-hidden">
      {/* 3-Column Core Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3">
        {/* LEFT PANEL: Incident Directory & Status Filters */}
        <div className="w-full lg:w-72 flex flex-col bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-100">
                ACTIVE INCIDENTS ({incidents.length})
              </span>
            </div>
            <button
              onClick={onNewIncidentClick}
              className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold flex items-center space-x-1 shadow transition"
              title="Create New Emergency Incident"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {incidents.map((inc) => {
              const isSelected = activeIncident?.incidentId === inc.incidentId;
              return (
                <div
                  key={inc.incidentId}
                  onClick={() => onSelectIncident(inc)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800/90 border-orange-500 shadow-lg'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono font-bold text-orange-400">{inc.incidentId}</span>
                    <span className={`px-2 py-0.5 rounded border font-bold ${getSeverityBadge(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-200 truncate">
                    {inc.title || inc.type}
                  </div>

                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {inc.location}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
                    <span>Casualties: <b>{inc.affectedPeople}</b></span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {inc.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Quick Summary */}
          {activeIncident && (
            <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-xs space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                SELECTED INCIDENT DETAILS
              </div>
              <div className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                {activeIncident.description}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {activeIncident.hazards.map((h, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 text-[9px] font-mono">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MAIN CENTER PANEL: Interactive Tactical Leaflet Map */}
        <div className="flex-1 flex flex-col min-w-0">
          <EmergencyMap
            incident={activeIncident}
            markers={markers}
            onLocationRecorded={onLocationRecorded}
          />
        </div>

        {/* RIGHT PANEL: Commander Plan, Moss Context, Agent Network, LiveKit */}
        <div className="w-full lg:w-[480px] flex flex-col bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center bg-slate-900 border-b border-slate-800 p-1 text-xs gap-1">
            <button
              onClick={() => setRightPanelTab('PLAN')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                rightPanelTab === 'PLAN' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Response Plan</span>
            </button>

            <button
              onClick={() => setRightPanelTab('MOSS')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                rightPanelTab === 'MOSS' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Moss Context</span>
            </button>

            <button
              onClick={() => setRightPanelTab('AGENTS')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                rightPanelTab === 'AGENTS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Agents ({agentResults.length})</span>
            </button>

            <button
              onClick={() => setRightPanelTab('LIVEKIT')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                rightPanelTab === 'LIVEKIT' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>LiveKit</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'PLAN' && (
              <ResponsePlanView
                currentPlan={latestPlan}
                allPlans={allPlans}
                onApprove={onApprovePlan}
                isLoading={isLoading}
              />
            )}

            {rightPanelTab === 'MOSS' && (
              <MossContextPanel items={contextItems} isDemoFallback={true} />
            )}

            {rightPanelTab === 'AGENTS' && (
              <AgentNetwork
                agentResults={agentResults}
                onTriggerAnalysis={onTriggerAnalysis}
                isLoading={isLoading}
              />
            )}

            {rightPanelTab === 'LIVEKIT' && activeIncident && (
              <LiveKitRoom incidentId={activeIncident.incidentId} />
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: Timeline, Quick Injected Update Input & Flagship Walkthrough */}
      <div className="h-28 bg-[#0a0e18] border-t border-slate-800 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl">
        {/* Timeline ticker */}
        <div className="w-full md:w-1/3 flex flex-col justify-center overflow-hidden pr-2 border-r border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <History className="w-3.5 h-3.5 text-orange-400" />
            <span>INCIDENT AUDIT TIMELINE</span>
          </div>
          <div className="text-[11px] text-slate-300 truncate font-mono">
            {timeline[0] ? `[${timeline[0].actor}] ${timeline[0].summary}` : 'Waiting for event telemetry...'}
          </div>
          <div className="text-[10px] text-slate-500">
            {timeline.length} total auditable events logged in database.
          </div>
        </div>

        {/* Field Update Injection (Dynamic Replanning Trigger) */}
        <form onSubmit={handleUpdateSubmit} className="w-full md:w-2/3 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder='Inject new field update, e.g. "Fire is now reported in one vehicle, and primary lane is blocked."'
              value={injectedText}
              onChange={(e) => setInjectedText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !injectedText.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-orange-900/30 disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Inject & Reassess</span>
          </button>

          <button
            type="button"
            onClick={() => onInjectUpdate('Fire is now reported in one vehicle, and the primary access lane is blocked.')}
            disabled={isLoading}
            className="px-3 py-2 bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 border border-purple-700 rounded-lg text-xs font-semibold transition shrink-0"
            title="Inject Flagship Hackathon Demo Escalation"
          >
            🔥 Demo Escalation
          </button>
        </form>
      </div>
    </div>
  );
};
