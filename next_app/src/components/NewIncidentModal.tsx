'use client';

import React, { useState } from 'react';
import { Incident } from '../types';
import { AlertTriangle, Plus, X, MapPin } from 'lucide-react';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Partial<Incident>) => void;
  isLoading?: boolean;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TRAFFIC_COLLISION');
  const [location, setLocation] = useState('Highway 101 Northbound Mile 24');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('CRITICAL');
  const [affectedPeople, setAffectedPeople] = useState(4);
  const [description, setDescription] = useState(
    'Two-vehicle high-speed collision on highway. Multiple occupants reported trapped. Fluid leak on pavement.'
  );
  const [hazards, setHazards] = useState('FLUID_LEAK, HIGHWAY_DEBRIS');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      title: title || `${type.replace('_', ' ')} at ${location}`,
      location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      severity,
      affectedPeople: Number(affectedPeople),
      description,
      hazards: hazards.split(',').map((h) => h.trim().toUpperCase()).filter(Boolean),
      status: 'ACTIVE',
      locationSource: 'USER_REPORTED'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e1422] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              DECLARE NEW EMERGENCY INCIDENT
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block font-bold text-slate-400 mb-1">INCIDENT TITLE (OPTIONAL)</label>
            <input
              type="text"
              placeholder="e.g. Highway 101 Northbound Multi-Vehicle Crash"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-400 mb-1">INCIDENT TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
              >
                <option value="TRAFFIC_COLLISION">TRAFFIC COLLISION</option>
                <option value="FIRE">STRUCTURE / WILDFIRE</option>
                <option value="HAZMAT">HAZMAT CHEMICAL SPILL</option>
                <option value="STRUCTURAL_COLLAPSE">STRUCTURAL COLLAPSE</option>
                <option value="FLOOD">FLASH FLOOD</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">SEVERITY LEVEL</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL (RED)</option>
                <option value="HIGH">HIGH (ORANGE)</option>
                <option value="MEDIUM">MEDIUM (YELLOW)</option>
                <option value="LOW">LOW (GREEN)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-400 mb-1">LOCATION DESCRIPTION</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-400 mb-1">LATITUDE</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">LONGITUDE</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">AFFECTED PEOPLE</label>
              <input
                type="number"
                min="0"
                value={affectedPeople}
                onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-400 mb-1">DESCRIPTION & DISPATCH NOTES</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-400 mb-1">HAZARDS (COMMA SEPARATED)</label>
            <input
              type="text"
              value={hazards}
              onChange={(e) => setHazards(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition shadow-lg shadow-orange-950/40 disabled:opacity-50"
            >
              {isLoading ? 'Declaring...' : 'Declare & Dispatch Agents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
