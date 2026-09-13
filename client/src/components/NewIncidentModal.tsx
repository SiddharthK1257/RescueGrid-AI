import React, { useState } from 'react';
import { PlusCircle, X, AlertTriangle, MapPin, Users, Flame, RefreshCw } from 'lucide-react';
import { Incident, IncidentSeverity } from '../types';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: Partial<Incident>) => Promise<void>;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Multi-Vehicle Collision');
  const [address, setAddress] = useState('Highway 101 Northbound, Mile 22');
  const [lat, setLat] = useState('37.7833');
  const [lng, setLng] = useState('-122.4167');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [affectedPeople, setAffectedPeople] = useState('4');
  const [description, setDescription] = useState('');
  const [hazards, setHazards] = useState('Vehicle fluid leak, highway shoulder congestion');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required.');
      return;
    }

    setIsCreating(true);
    try {
      await onCreate({
        title,
        type,
        location: {
          address,
          lat: parseFloat(lat) || 37.7833,
          lng: parseFloat(lng) || -122.4167
        },
        severity,
        affectedPeople: parseInt(affectedPeople, 10) || 1,
        description,
        hazards: hazards.split(',').map((h) => h.trim()).filter(Boolean)
      });
      onClose();
    } catch (err) {
      alert('Failed to create incident');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0d1322] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              CREATE NEW EMERGENCY INCIDENT
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Initializes MOSS context space and delegates tasks to specialized agents
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="text-slate-300 font-bold block mb-1">INCIDENT TITLE:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tanker Truck Rollover with Vapor Leak"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">INCIDENT TYPE:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Multi-Vehicle Collision">Multi-Vehicle Collision</option>
                <option value="Structural Fire">Structural Fire</option>
                <option value="Hazmat Chemical Spill">Hazmat Chemical Spill</option>
                <option value="Flash Flood / Water Rescue">Flash Flood / Water Rescue</option>
                <option value="Industrial Explosion">Industrial Explosion</option>
                <option value="Mass Casualty Incident">Mass Casualty Incident</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">SEVERITY LEVEL:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">LOCATION ADDRESS:</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address or Mile Marker"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">LATITUDE:</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">LONGITUDE:</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">AFFECTED PEOPLE:</label>
              <input
                type="number"
                value={affectedPeople}
                onChange={(e) => setAffectedPeople(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">INITIAL 911 REPORT / DISPATCH TEXT:</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the initial emergency report in detail..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">REPORTED HAZARDS (comma separated):</label>
            <input
              type="text"
              value={hazards}
              onChange={(e) => setHazards(e.target.value)}
              placeholder="Flammable fluid, live power line, toxic smoke"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950 cursor-pointer"
            >
              {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              <span>INITIALIZE INCIDENT & RUN MOSS PIPELINE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
