import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Truck, Package, ArrowRightCircle, RefreshCw, XCircle } from 'lucide-react';

const statusConfig = {
  Created: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: Package
  },
  Assigned: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    icon: Clock
  },
  'Picked Up': {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    icon: Package
  },
  'In Transit': {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: Truck
  },
  'Out for Delivery': {
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500 animate-pulse',
    icon: ArrowRightCircle
  },
  Delivered: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2
  },
  Failed: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500 animate-ping',
    icon: AlertTriangle
  },
  Rescheduled: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    icon: RefreshCw
  },
  Cancelled: {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    icon: XCircle
  }
};

const StatusBadge = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.Created;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'lg' 
    ? 'px-3.5 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
