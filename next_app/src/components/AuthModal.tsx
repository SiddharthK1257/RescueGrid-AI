'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  UserCheck,
  Lock,
  Mail,
  User,
  BadgeAlert,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';
import { AuthUser } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, loginAsDemo, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PERSONAS' | 'LOGIN' | 'REGISTER'>('PERSONAS');
  const [seedUsers, setSeedUsers] = useState<Array<AuthUser & { password: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'COMMANDER_OPERATOR' | 'DISPATCHER' | 'FIELD_LEAD' | 'OBSERVER'>('COMMANDER_OPERATOR');
  const [regDepartment, setRegDepartment] = useState('Emergency Operations Command');

  useEffect(() => {
    if (isAuthModalOpen) {
      api.getSeedUsers().then((res) => {
        if (res.success && res.users) {
          setSeedUsers(res.users);
        }
      }).catch(() => {});
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleDemoClick = async (u: AuthUser & { password: string }) => {
    setLoading(true);
    setError(null);
    const res = await loginAsDemo(u);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to authenticate demo user.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please provide both email and password.');
    } else {
      setLoading(true);
      setError(null);
      const res = await login(loginEmail, loginPassword);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError('Please fill in all required fields.');
    } else {
      setLoading(true);
      setError(null);
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        department: regDepartment
      });
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      }
    }
  };

  const roleColors: Record<string, string> = {
    COMMANDER_OPERATOR: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
    DISPATCHER: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
    FIELD_LEAD: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
    OBSERVER: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-orange-500/40 bg-[#0b0f19] p-6 shadow-2xl shadow-orange-950/50 flex flex-col space-y-5 overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-400 shadow-inner">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono tracking-wider m-0">
                  RESCUEGRID AUTHENTICATION
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> JWT ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono m-0">
                Cryptographically signed JWT operator access & role-based incident control
              </p>
            </div>
          </div>
          {user && (
            <button
              onClick={closeAuthModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-mono relative z-10">
          <button
            onClick={() => { setActiveTab('PERSONAS'); setError(null); }}
            className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'PERSONAS'
                ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-CLICK PERSONAS</span>
          </button>
          <button
            onClick={() => { setActiveTab('LOGIN'); setError(null); }}
            className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'LOGIN'
                ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>SECURE SIGN IN</span>
          </button>
          <button
            onClick={() => { setActiveTab('REGISTER'); setError(null); }}
            className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'REGISTER'
                ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>REGISTER OPERATOR</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: 1-Click Operational Personas */}
        {activeTab === 'PERSONAS' && (
          <div className="space-y-3 relative z-10">
            <p className="text-xs text-slate-300 font-mono">
              Select an emergency command persona to instantly issue a cryptographically signed JWT token:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(seedUsers.length > 0 ? seedUsers : [
                {
                  userId: 'usr-commander-01',
                  name: 'Chief Sarah Jenkins',
                  email: 'commander@rescuegrid.ai',
                  password: 'Commander2026!',
                  role: 'COMMANDER_OPERATOR',
                  department: 'Incident Command Post (Sector Alpha)',
                  badgeNumber: 'CMD-9001'
                },
                {
                  userId: 'usr-dispatcher-02',
                  name: 'Marcus Vance',
                  email: 'dispatcher@rescuegrid.ai',
                  password: 'Dispatch2026!',
                  role: 'DISPATCHER',
                  department: 'Regional 911 Emergency Communications',
                  badgeNumber: 'DSP-4420'
                },
                {
                  userId: 'usr-fieldlead-03',
                  name: 'Capt. Elena Rostova',
                  email: 'fieldlead@rescuegrid.ai',
                  password: 'Rescue2026!',
                  role: 'FIELD_LEAD',
                  department: 'Heavy Extrication & HazMat Taskforce',
                  badgeNumber: 'FLD-7782'
                },
                {
                  userId: 'usr-medical-04',
                  name: 'Dr. Aris Thorne',
                  email: 'medical@rescuegrid.ai',
                  password: 'Medical2026!',
                  role: 'COMMANDER_OPERATOR',
                  department: 'Trauma & Emergency Medical Services',
                  badgeNumber: 'MED-1109'
                }
              ]).map((u: any) => {
                const isCurrent = user?.email === u.email;
                return (
                  <button
                    key={u.email}
                    onClick={() => handleDemoClick(u)}
                    disabled={loading}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-900/60 hover:border-orange-500/60 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.department}</div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${roleColors[u.role] || 'text-orange-400 border-orange-800'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Badge: <strong className="text-slate-300">{u.badgeNumber}</strong></span>
                      <span className="text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                        Authenticate <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Standard Login */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-400" /> Operative Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="commander@rescuegrid.ai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-400" /> Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-mono font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating JWT...</span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Verify Credentials & Issue JWT</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Register */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Officer Jane Doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-400" /> Official Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jane.doe@rescuegrid.ai"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <BadgeAlert className="w-3.5 h-3.5 text-orange-400" /> Tactical Role
                </label>
                <select
                  value={regRole}
                  onChange={(e: any) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
                >
                  <option value="COMMANDER_OPERATOR">COMMANDER (Full Incident Authority)</option>
                  <option value="DISPATCHER">DISPATCHER (Resource Allocation)</option>
                  <option value="FIELD_LEAD">FIELD LEAD (Tactical Extrication)</option>
                  <option value="OBSERVER">OBSERVER (Read-Only Telemetry)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Department / Division</label>
              <input
                type="text"
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                placeholder="Emergency Operations Center"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-orange-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Enrolling Operative...</span> : <span>Register & Issue JWT Token</span>}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="border-t border-slate-800/80 pt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            HMAC SHA-256 JWT Signed
          </span>
          <span>Tokens securely cached in local storage</span>
        </div>
      </div>
    </div>
  );
};
