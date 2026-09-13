import React from 'react';
import { Truck, ShieldCheck, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { EmergencyResource } from '../types';

interface ResourceManagementProps {
  resources: EmergencyResource[];
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({ resources }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322]/90 backdrop-blur-md p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono m-0 p-0">
              EMERGENCY RESOURCE & APPARATUS MANAGEMENT
            </h2>
            <p className="text-xs text-slate-400 m-0 p-0">
              Calculated by Resource Agent with continuous demand re-evaluation
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded">
          {resources.length} APPARATUS CATEGORIES ALLOCATED
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2.5 px-3">Apparatus / Resource</th>
              <th className="py-2.5 px-3">Quantity</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Operational Reason</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {resources.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 font-mono">
                  No apparatus requirements calculated yet.
                </td>
              </tr>
            ) : (
              resources.map((res) => (
                <tr key={res.resourceId} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{res.name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                      {res.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.priority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : res.priority === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {res.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans max-w-xs">{res.reason}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {res.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {res.etaMinutes || 8} mins
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>⚠️ Operational Guardrail: Resource status represents simulation recommendation pending human dispatch approval.</span>
        <span className="text-purple-300 font-mono font-bold">RESOURCE AGENT V1</span>
      </div>
    </div>
  );
};
