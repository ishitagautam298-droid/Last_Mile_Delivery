import React from 'react';
import { CheckCircle2, Clock, User, ShieldCheck, Cpu, AlertCircle, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';

const actorConfig = {
  customer: { label: 'Customer', icon: User, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  agent: { label: 'Delivery Agent', icon: Clock, badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  admin: { label: 'Admin Ops', icon: ShieldCheck, badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  system: { label: 'System Engine', icon: Cpu, badge: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const OrderTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No tracking history recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timeline.map((entry, index) => {
        const actor = actorConfig[entry.actor?.role] || actorConfig.system;
        const ActorIcon = actor.icon;
        const isLatest = index === timeline.length - 1;

        return (
          <div key={entry._id || index} className="relative group">
            {/* Timeline Node Icon */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isLatest 
                ? 'bg-blue-600 border-white ring-4 ring-blue-100 text-white' 
                : 'bg-white border-slate-300 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-white' : 'bg-slate-400'}`} />
            </div>

            {/* Timeline Item Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              isLatest 
                ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50' 
                : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.newStatus} size="sm" />
                  {entry.previousStatus && (
                    <span className="text-xs text-slate-400">
                      (from {entry.previousStatus})
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {new Date(entry.timestamp).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Actor Badge */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-medium ${actor.badge}`}>
                  <ActorIcon className="w-3 h-3" />
                  <span>{entry.actor?.name || actor.label}</span>
                </span>
                {entry.location?.description && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 truncate max-w-xs">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{entry.location.description}</span>
                  </span>
                )}
              </div>

              {/* Notes or Reason */}
              {entry.notes && (
                <p className="mt-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-100 font-sans">
                  {entry.notes}
                </p>
              )}

              {entry.reason && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Failure Reason:</strong> {entry.reason}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
