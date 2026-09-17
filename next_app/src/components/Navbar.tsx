'use client';

import React from 'react';
import {
  ShieldAlert,
  Radio,
  Brain,
  MapPin,
  Cpu,
  Layers,
  FileText,
  Clock,
  PlayCircle,
  Settings,
  Truck,
  MessageSquare,
  Activity,
  AlertOctagon,
  Sparkles,
  Lock,
  LogOut,
  User
} from 'lucide-react';
import { SystemHealth } from '../types';
import { useAuth } from '../services/authContext';

export type NavTab =
  | 'WORKSPACE'
  | 'COMMAND_CENTRE'
  | 'LIVE_INCIDENTS'
  | 'MAP'
  | 'AGENT_NETWORK'
  | 'SHARED_CONTEXT'
  | 'RESPONSE_PLANS'
  | 'TIMELINE'
  | 'RESOURCES'
  | 'COLLABORATION'
  | 'SIMULATION'
  | 'AUDIT_LOG'
  | 'SETTINGS';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  systemHealth: SystemHealth | null;
  onOpenSimulation: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  systemHealth,
  onOpenSimulation,
  onOpenSettings,
}) => {
  const { user, openAuthModal, logout } = useAuth();

  const roleBadgeStyle: Record<string, string> = {
    COMMANDER_OPERATOR: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    DISPATCHER: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    FIELD_LEAD: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    OBSERVER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };

  return (
    <header className="h-16 bg-[#080c14] border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('WORKSPACE')}>
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-sm tracking-wider text-slate-100 uppercase">
              RESCUEGRID<span className="text-orange-500">.AI</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-orange-950/60 text-orange-400 border border-orange-800/80 text-[9px] font-bold">
              PROTOTYPE
            </span>
          </div>
          <div className="text-[10px] text-slate-400 hidden sm:block">
            One Emergency. Many AI Agents. One Shared Context.
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden xl:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => onSelectTab('WORKSPACE')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'WORKSPACE' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Workspace</span>
        </button>

        <button
          onClick={() => onSelectTab('COMMAND_CENTRE')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'COMMAND_CENTRE' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Command Centre</span>
        </button>

        <button
          onClick={() => onSelectTab('MAP')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'MAP' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Tactical Map</span>
        </button>

        <button
          onClick={() => onSelectTab('SHARED_CONTEXT')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'SHARED_CONTEXT' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Moss Context</span>
        </button>

        <button
          onClick={() => onSelectTab('AGENT_NETWORK')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'AGENT_NETWORK' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Agents</span>
        </button>

        <button
          onClick={() => onSelectTab('RESPONSE_PLANS')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'RESPONSE_PLANS' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Plans</span>
        </button>

        <button
          onClick={() => onSelectTab('COLLABORATION')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'COLLABORATION' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>LiveKit Voice</span>
        </button>

        <button
          onClick={() => onSelectTab('TIMELINE')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'TIMELINE' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>
      </nav>

      {/* Right Quick Controls */}
      <div className="flex items-center space-x-2">
        {/* Flagship Simulation Trigger */}
        <button
          onClick={onOpenSimulation}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-purple-950/40"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hackathon Demo</span>
        </button>

        {/* System Health Indicators */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-mono font-semibold">ALL SERVICES ONLINE</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition"
          title="System Settings and Health Diagnostics"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* JWT Auth Profile / Switch Persona / Login Button */}
        {user ? (
          <div className="flex items-center space-x-1.5 pl-1 border-l border-slate-800">
            <button
              onClick={openAuthModal}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
              title={`Logged in as ${user.name} (${user.role}) - Click to switch persona`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white text-[11px] font-mono font-bold shadow-inner">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-white font-mono leading-tight truncate max-w-[100px]">
                  {user.name.split(' ')[0]}
                </div>
                <div className={`text-[9px] font-mono px-1 rounded border inline-block ${roleBadgeStyle[user.role] || 'text-orange-400 border-orange-800'}`}>
                  {user.role.replace('_OPERATOR', '').replace('_', ' ')}
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950 hover:border-rose-700 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors cursor-pointer"
              title="Log Out (Clear JWT Session)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer animate-pulse"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>JWT LOGIN</span>
          </button>
        )}
      </div>
    </header>
  );
};
