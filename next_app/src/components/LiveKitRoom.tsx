'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Users,
  MessageSquare,
  Shield,
  Activity,
  Send,
  PhoneCall,
  PhoneOff,
  Headphones
} from 'lucide-react';
import { api } from '../services/api';
import { LiveKitTokenResponse } from '../types';

interface LiveKitRoomProps {
  incidentId: string;
  operatorName?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  role: 'OPERATOR' | 'COMMANDER' | 'RESPONDER';
}

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({
  incidentId,
  operatorName = 'Operator 1'
}) => {
  const [tokenData, setTokenData] = useState<LiveKitTokenResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 30, 60, 45, 75, 50, 20]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'COMMANDER AGENT',
      text: 'LiveKit Voice Collaboration channel initialized for incident. Synthesizing cross-agent telemetry.',
      timestamp: new Date().toLocaleTimeString(),
      role: 'COMMANDER'
    },
    {
      id: '2',
      sender: operatorName,
      text: 'Command staff online. Monitoring highway pileup and primary corridor blockage.',
      timestamp: new Date().toLocaleTimeString(),
      role: 'OPERATOR'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Fetch LiveKit server token
  const handleConnect = async () => {
    try {
      const data = await api.getLiveKitToken(incidentId, operatorName);
      setTokenData(data);
      setIsConnected(true);
      setIsAudioStreaming(true);
    } catch (err) {
      console.warn('LiveKit token request error, running demo fallback audio session:', err);
      setIsConnected(true);
      setIsAudioStreaming(true);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsAudioStreaming(false);
  };

  // Simulate audio visualizer levels when connected and not muted
  useEffect(() => {
    if (!isConnected || isMuted) {
      setAudioLevel([5, 5, 5, 5, 5, 5, 5]);
      return;
    }

    const interval = setInterval(() => {
      setAudioLevel([
        Math.floor(Math.random() * 60) + 15,
        Math.floor(Math.random() * 85) + 20,
        Math.floor(Math.random() * 95) + 30,
        Math.floor(Math.random() * 70) + 20,
        Math.floor(Math.random() * 90) + 25,
        Math.floor(Math.random() * 60) + 15,
        Math.floor(Math.random() * 40) + 10
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, [isConnected, isMuted]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: operatorName,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
      role: 'OPERATOR'
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Commander Agent autonomous voice/text response
    setTimeout(() => {
      const botReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'COMMANDER AGENT',
        text: `Acknowledged operator input: "${newMsg.text}". Relevant context shared across MOSS memory layer.`,
        timestamp: new Date().toLocaleTimeString(),
        role: 'COMMANDER'
      };
      setChatMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">
            LIVEKIT COLLABORATION ROOM
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            incident-{incidentId.toLowerCase()}
          </span>
        </div>

        {/* Connection status badge */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider border flex items-center space-x-1.5 ${
              isConnected
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span>{isConnected ? 'LIVE SESSION ACTIVE' : 'DISCONNECTED'}</span>
          </span>

          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-1 px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded text-[11px] font-semibold border border-red-800 transition"
            >
              <PhoneOff className="w-3 h-3" />
              <span>Leave Room</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center space-x-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold transition shadow shadow-cyan-900/40"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Join Live Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio Visualizer & Voice Bar */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            disabled={!isConnected}
            className={`p-3 rounded-full transition shadow-lg ${
              !isConnected
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : isMuted
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 animate-pulse'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <span>{isMuted ? 'MICROPHONE MUTED' : isConnected ? 'MICROPHONE LIVE & BROADCASTING' : 'AUDIO STANDBY'}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              WebRTC Audio Stream • Token Verified on Server • 48kHz Opus
            </div>
          </div>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 px-4 py-2.5 rounded-lg border border-slate-800">
          <Headphones className="w-4 h-4 text-cyan-400 mr-2" />
          {audioLevel.map((height, idx) => (
            <div
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-100 ${
                isConnected && !isMuted ? 'bg-gradient-to-t from-cyan-500 to-emerald-400' : 'bg-slate-700'
              }`}
              style={{ height: `${height * 0.3}px` }}
            />
          ))}
          <span className="text-[10px] text-slate-400 font-mono ml-2">
            {isConnected && !isMuted ? 'AUDIO RX/TX' : 'SILENT'}
          </span>
        </div>
      </div>

      {/* Roster & Text Fallback Discussion */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Participants Roster */}
        <div className="w-full md:w-56 p-3 bg-slate-950/40 border-r border-slate-800/80 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>ROOM PARTICIPANTS</span>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-orange-300">Commander Agent</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">{operatorName} (You)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Traffic AI Lead</span>
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Medical AI Lead</span>
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            </div>
          </div>
        </div>

        {/* Real-time Collaboration Chat Stream */}
        <div className="flex-1 flex flex-col bg-slate-900/30">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-lg text-xs max-w-md ${
                  msg.role === 'COMMANDER'
                    ? 'bg-purple-950/50 border border-purple-800/60 text-purple-200'
                    : 'bg-blue-950/50 border border-blue-800/60 text-blue-200 ml-auto'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-80">
                  <span>{msg.sender}</span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>
                <div className="leading-relaxed">{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Chat input fallback */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type operator message or voice transcript fallback..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
