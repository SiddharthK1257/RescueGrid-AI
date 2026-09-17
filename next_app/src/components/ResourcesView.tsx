'use client';

import React from 'react';
import { Truck, ShieldCheck, Clock, MapPin, AlertCircle } from 'lucide-react';

export const ResourcesView: React.FC = () => {
  const apparatus = [
    {
      id: 'MED-ALS-01',
      name: 'Ambulance Medic 42 (ALS)',
      type: 'Advanced Life Support',
      station: 'Staging Area Alpha (Exit 42B)',
      status: 'STAGED',
      eta: 'On Scene',
      crew: '2 Paramedics',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800'
    },
    {
      id: 'MED-ALS-02',
      name: 'Ambulance Medic 43 (ALS)',
      type: 'Advanced Life Support',
      station: 'En Route via North Service Road',
      status: 'IN TRANSIT',
      eta: '3 mins',
      crew: '2 Paramedics',
      badge: 'bg-blue-950 text-blue-300 border-blue-800'
    },
    {
      id: 'RSC-HWY-01',
      name: 'Heavy Rescue Squad 9',
      type: 'Extrication & Hydraulic Cutters',
      station: 'Crash Perimeter Hot Zone',
      status: 'DEPLOYED',
      eta: 'On Scene',
      crew: '4 Specialists',
      badge: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      id: 'ENG-PUMP-04',
      name: 'Engine 14 (Class B Foam)',
      type: 'Thermal Fire Suppression',
      station: 'Upwind Attack Position',
      status: 'ACTIVE',
      eta: 'On Scene',
      crew: '3 Firefighters',
      badge: 'bg-red-950 text-red-300 border-red-800'
    },
    {
      id: 'AIR-MED-01',
      name: 'LifeFlight Helo 1',
      type: 'Air Medical Evacuation',
      station: 'Regional Trauma LZ',
      status: 'STANDBY',
      eta: '7 mins',
      crew: 'Flight Nurse & Flight Paramedic',
      badge: 'bg-purple-950 text-purple-300 border-purple-800'
    },
    {
      id: 'POL-ESC-02',
      name: 'Highway Patrol Cruiser 18',
      type: 'Corridor Traffic Diversion',
      station: 'Exit 41 Divert Point',
      status: 'STAGED',
      eta: 'On Scene',
      crew: '1 Trooper',
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0e1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Truck className="w-5 h-5 text-orange-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              EMERGENCY RESOURCE & APPARATUS STAGING
            </h2>
            <p className="text-[11px] text-slate-400">
              Coordinated Mutual Aid Apparatus Allocations
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          6 Units Tracked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {apparatus.map((app) => (
          <div
            key={app.id}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-orange-400">{app.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${app.badge}`}>
                {app.status}
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-200 text-sm">{app.name}</div>
              <div className="text-xs text-slate-400">{app.type}</div>
            </div>

            <div className="space-y-1 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{app.station}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>ETA: <b>{app.eta}</b></span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                Crew: {app.crew}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
