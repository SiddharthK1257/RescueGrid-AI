import React from 'react';
import {
  ShieldAlert,
  Radio,
  Cpu,
  Database,
  Brain,
  PlusCircle,
  PlayCircle,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Lock,
  MapPin,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { Incident, SettingsStatus } from '../types';
import { useAuth } from '../services/authContext';

interface NavbarProps {
  incidents: Incident[];
  activeIncident: Incident | null;
  onSelectIncident: (id: string) => void;
  onNewIncident: () => void;
  onOpenSimulation: () => void;
  onOpenSettings: () => void;
  settingsStatus: SettingsStatus | null;
  contextCount: number;
  socketConnected: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  incidents,
  activeIncident,
  onSelectIncident,
  onNewIncident,
  onOpenSimulation,
  onOpenSettings,
  settingsStatus,
  contextCount,
  socketConnected,
  soundEnabled = true,
  onToggleSound
}) => {
  const { user, openAuthModal, logout } = useAuth();

  const roleBadgeStyle: Record<string, string> = {
    COMMANDER_OPERATOR: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    DISPATCHER: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    FIELD_LEAD: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    OBSERVER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };

  return (
    <header className="border-b border-slate-800 bg-[#0a0e1a]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-700/40 border border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-950/60">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider text-white flex items-center gap-1.5 m-0 p-0 font-mono">
                RESCUE<span className="text-cyan-400">GRID</span> <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">AI</span>
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                v2.0 MISSION READY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 p-0 tracking-wide hidden md:block">
              Multi-Agent Emergency Response • MOSS Shared Context • Real Data & Free Live Map
            </p>
          </div>
        </div>

        {/* Live Architecture Status Badges */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
          {/* MOSS Context Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-sm">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>MOSS MEMORY:</span>
            <span className="font-bold text-white px-1.5 py-0.2 bg-cyan-500/20 rounded">
              {contextCount} items
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>

          {/* Gemini AI Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>GEMINI 3.6 FLASH:</span>
            <span className="text-emerald-400 font-bold">
              {settingsStatus?.gemini.configured ? 'ACTIVE' : 'CONNECTED'}
            </span>
          </div>

          {/* MongoDB Status */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-purple-500/50 cursor-pointer transition-colors"
            title="Click to view/configure MongoDB Atlas"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>DB:</span>
            <span className={`font-bold ${settingsStatus?.db.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {settingsStatus?.db.type === 'MONGODB_ATLAS' ? 'ATLAS REAL DATA' : 'LOCAL CACHE'}
            </span>
          </button>

          {/* Free Live Map Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold">LIVE MAP: FREE OSM</span>
          </div>

          {/* Socket.IO Stream */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${socketConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-[11px]">{socketConnected ? 'STREAM LIVE' : 'CONNECTING'}</span>
          </div>
        </div>

        {/* Action Controls, Incident Selector & Auth Profile */}
        <div className="flex items-center gap-2">
          {/* Incident Selector Dropdown */}
          <div className="relative">
            <select
              value={activeIncident?.incidentId || ''}
              onChange={(e) => onSelectIncident(e.target.value)}
              className="appearance-none bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-mono font-medium rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm hover:border-slate-600 transition-colors max-w-[170px] sm:max-w-[210px] truncate"
            >
              {incidents.map((inc) => (
                <option key={inc.incidentId} value={inc.incidentId} className="bg-slate-900 text-slate-200">
                  [{inc.incidentId}] {inc.title.substring(0, 22)}...
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* New Incident Button */}
          <button
            onClick={onNewIncident}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Create New Emergency Incident"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">New Incident</span>
          </button>

          {/* Scenarios / Flagship Demo Button */}
          <button
            onClick={onOpenSimulation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-cyan-950 cursor-pointer"
            title="Run Flagship Demo or Scenarios"
          >
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Flagship Demo</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Configure Real Database & Gemini API Key"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Sound Toggle (if provided) */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute Tactical Sounds' : 'Enable Tactical Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          )}

          {/* JWT User Profile / Login Button */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer"
                title={`Logged in as ${user.name} (${user.role}) - Click to switch persona`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-mono font-bold shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-bold text-white font-mono leading-tight truncate max-w-[110px]">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className={`text-[9px] font-mono px-1 rounded border inline-block ${roleBadgeStyle[user.role] || 'text-cyan-400 border-cyan-800'}`}>
                    {user.role.replace('_OPERATOR', '')}
                  </div>
                </div>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:border-rose-700 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors cursor-pointer"
                title="Log Out (Clear JWT Session)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer animate-pulse"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>JWT LOGIN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
