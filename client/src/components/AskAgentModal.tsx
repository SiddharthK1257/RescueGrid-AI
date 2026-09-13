import React, { useState } from 'react';
import { MessageCircleQuestion, Send, RefreshCw, X, Shield, Activity, Car, AlertCircle, Truck, MessageSquare } from 'lucide-react';
import { AgentName } from '../types';
import { api } from '../services/api';

interface AskAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  initialAgent?: AgentName;
}

export const AskAgentModal: React.FC<AskAgentModalProps> = ({
  isOpen,
  onClose,
  incidentId,
  initialAgent = 'TRAFFIC'
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentName>(initialAgent);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    setAnswer(null);

    try {
      const res = await api.askAgent(incidentId, selectedAgent, question);
      setAnswer(res.answer || 'Agent responded based on current sector telemetry.');
    } catch (err: any) {
      setAnswer(`Error querying agent: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  const sampleQuestions: Record<AgentName, string[]> = {
    TRAFFIC: [
      'Can responding units still pass via North Bypass Route 4B?',
      'What is the traffic congestion delay at Exit 14?',
      'Are police detour signs deployed along the western corridor?'
    ],
    MEDICAL: [
      'Are the two critical casualties stabilized for transport?',
      'Do we have sufficient burn airway kits on scene?',
      'Has the regional trauma center been placed on emergency standby?'
    ],
    RESCUE: [
      'Is the vehicle fire contained enough to begin hydraulic cutting?',
      'What is the structural stability of the third sedan passenger compartment?',
      'Are high-voltage EV battery lines isolated?'
    ],
    RESOURCE: [
      'What is the estimated arrival time of the secondary heavy rescue squad?',
      'Are additional fire engines required for water supply relay?',
      'Can police units be reinforced for crowd control?'
    ],
    COMMUNICATION: [
      'Has the public safety detour advisory been broadcasted?',
      'What is the media briefing statement for the 11:00 AM update?',
      'Is inter-agency mobile repeater channel 4 active?'
    ],
    COMMANDER: [
      'What is our primary operational objective for the next 15 minutes?',
      'Explain the tactical resolution between Medical and Traffic priorities.',
      'Under what conditions should we escalate this incident to Level 3?'
    ],
    SITUATION: [
      'What are the primary remaining operational uncertainties?',
      'Has the incident status shifted from ACTIVE RESPONSE to ESCALATED?',
      'What is the latest weather forecast impact on scene safety?'
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0d1322] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <MessageCircleQuestion className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              QUERY SPECIALIZED AGENT
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Direct operator tactical dialogue grounded in MOSS shared context
            </p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="mb-4">
          <label className="text-xs font-mono font-bold text-slate-300 uppercase block mb-1.5">
            SELECT TARGET SPECIALIST:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs font-mono">
            {(['TRAFFIC', 'MEDICAL', 'RESCUE', 'RESOURCE', 'COMMUNICATION', 'COMMANDER', 'SITUATION'] as AgentName[]).map(
              (agent) => (
                <button
                  key={agent}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setAnswer(null);
                  }}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedAgent === agent
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {agent}
                </button>
              )
            )}
          </div>
        </div>

        {/* Quick Sample Questions */}
        <div className="mb-3 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">
            SUGGESTED TACTICAL QUERIES:
          </span>
          <div className="space-y-1">
            {(sampleQuestions[selectedAgent] || []).map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setQuestion(sample)}
                className="w-full text-left text-[11px] p-2 rounded bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer truncate"
              >
                💬 "{sample}"
              </button>
            ))}
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask ${selectedAgent} Agent a specific question...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={handleAsk}
              disabled={isAsking || !question.trim()}
              className="absolute right-2 top-2 p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
              {isAsking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {/* Answer Box */}
          {answer && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase">
                <span>[{selectedAgent} AGENT RESPONSE VIA MOSS]:</span>
                <span>VERIFIED TELEMETRY</span>
              </div>
              <p className="text-slate-200 leading-relaxed m-0 font-sans text-xs">{answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
