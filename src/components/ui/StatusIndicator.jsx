import React from 'react';

const statusMap = {
    Active: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
    Maintenance: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
    Retired: { color: 'text-slate-400 bg-slate-700 border-slate-600', dot: 'bg-slate-400' },
    ok: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
    low: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
    critical: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
    approved: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
    rejected: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
    pending: { color: 'text-slate-400 bg-slate-700 border-slate-600', dot: 'bg-slate-400' },
    dept_review: { color: 'text-zinc-300 bg-zinc-600/10 border-zinc-500/30', dot: 'bg-blue-400' },
    finance_review: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', dot: 'bg-purple-400' },
    requested: { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', dot: 'bg-cyan-400' },
    Good: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
    Fair: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
    Poor: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
};

const labels = { dept_review: 'Dept Review', finance_review: 'Finance Review', requested: 'Requested', ok: 'In Stock' };

export default function StatusIndicator({ status, showDot = true, size = 'sm' }) {
    const s = statusMap[status] || statusMap.pending;
    const label = labels[status] || status;
    const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${s.color} ${sz}`}>
            {showDot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
            {label}
        </span>
    );
}
