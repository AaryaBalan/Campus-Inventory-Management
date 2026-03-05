import React, { useState } from 'react';
import {
    MapPin, AlertTriangle, CheckCircle, Wrench, Users,
    Package, DollarSign, Clock, X, Building2, Activity,
    ChevronRight, BarChart3
} from 'lucide-react';
import { buildings, assets } from '../../data/mockData.js';

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = v =>
    v >= 1_000_000 ? `₹${(v / 1_000_000).toFixed(2)}M`
        : v >= 1_000 ? `₹${(v / 1_000).toFixed(0)}K`
            : `₹${v}`;

const CAT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
const CAT_ICON = {
    Electronics: '💻', Furniture: '🪑', 'Lab Equipment': '🔬',
    Networking: '🌐', HVAC: '❄️', Electrical: '⚡',
    Security: '🔒', Appliances: '☕', Others: '📦'
};

/* ─── tiny components ─────────────────────────────────────────── */
function HealthBar({ h }) {
    const t = h.Good + h.Fair + h.Poor || 1;
    return (
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            <div style={{ width: `${(h.Good / t) * 100}%` }} className="bg-emerald-500" />
            <div style={{ width: `${(h.Fair / t) * 100}%` }} className="bg-amber-400" />
            <div style={{ width: `${(h.Poor / t) * 100}%` }} className="bg-red-500" />
        </div>
    );
}

function Donut({ categories, total }) {
    const r = 30, circ = 2 * Math.PI * r;
    let off = 0;
    return (
        <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
            <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="13" />
            {categories.map((c, i) => {
                const dash = (c.count / total) * circ;
                const el = (
                    <circle key={c.name} cx="40" cy="40" r={r} fill="none"
                        stroke={CAT_COLORS[i % CAT_COLORS.length]}
                        strokeWidth="13"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-off}
                        transform="rotate(-90 40 40)" />
                );
                off += dash;
                return el;
            })}
            <text x="40" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{total}</text>
        </svg>
    );
}

/* ─── Stats drawer ────────────────────────────────────────────── */
function StatsDrawer({ b, onClose }) {
    const { Good, Fair, Poor } = b.health;
    const healthPct = Math.round((Good / b.assetCount) * 100);
    const locationAssets = assets.filter(a => a.location === b.name);

    return (
        /* Backdrop */
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center p-0 sm:p-6"
            onClick={e => e.target === e.currentTarget && onClose()}>

            {/* Glass backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-50 w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh]
                            flex flex-col rounded-t-3xl sm:rounded-2xl
                            bg-zinc-900 border border-zinc-700/60
                            shadow-2xl shadow-black/60 overflow-hidden">

                {/* Drag handle (mobile) */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-zinc-600" />
                </div>

                {/* Header */}
                <div className="px-8 pt-5 pb-6 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${b.color}28 0%, transparent 60%)` }}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1
                                            rounded-full border"
                                style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}18` }}>
                                <Building2 size={10} /> {b.zone}
                            </span>
                            <h2 className="text-white text-2xl font-bold">{b.name}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Clock size={10} /> Audited {b.lastAudit}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={10} /> {b.assignedStaff} staff
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-400 hover:text-white
                                       transition-colors shrink-0 mt-1">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Alert / OK strip */}
                    <div className={`mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm
                        ${b.alertCount > 0
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'}`}>
                        {b.alertCount > 0
                            ? <AlertTriangle size={14} className="shrink-0" />
                            : <CheckCircle size={14} className="shrink-0" />}
                        <span>{b.alertCount > 0 ? `${b.alertCount} active alert · ` : ''}{b.recentActivity}</span>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-7">

                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { icon: <Package size={15} />, label: 'Total Assets', val: b.assetCount, sub: `Active: ${b.activeAssets}`, c: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                            { icon: <DollarSign size={15} />, label: 'Asset Value', val: fmt(b.totalValue), sub: 'Estimated', c: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                            { icon: <Wrench size={15} />, label: 'Maintenance', val: b.maintenanceAssets, sub: `Retired: ${b.retiredAssets}`, c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                            { icon: <Activity size={15} />, label: 'Fleet Health', val: `${healthPct}%`, sub: `${Good} good`, c: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                        ].map(k => (
                            <div key={k.label} className={`border rounded-2xl p-5 ${k.c}`}>
                                <div className={`flex items-center gap-2 mb-3 ${k.c.split(' ')[0]}`}>
                                    {k.icon}
                                    <span className="text-xs text-slate-400 font-medium">{k.label}</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{k.val}</p>
                                <p className="text-slate-500 text-xs mt-1">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Health + Categories in 2 cols */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        {/* Health */}
                        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-6 space-y-4">
                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Asset Health</p>
                            <HealthBar h={b.health} />
                            <div className="grid grid-cols-3 gap-2">
                                {[{ l: 'Good', v: Good, c: 'text-emerald-400', dot: 'bg-emerald-500' },
                                { l: 'Fair', v: Fair, c: 'text-amber-400', dot: 'bg-amber-400' },
                                { l: 'Poor', v: Poor, c: 'text-red-400', dot: 'bg-red-500' }].map(h => (
                                    <div key={h.l} className="text-center">
                                        <p className={`text-lg font-bold ${h.c}`}>{h.v}</p>
                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${h.dot}`} />
                                            <span className="text-slate-500 text-[10px]">{h.l}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Status counts */}
                            <div className="pt-2 border-t border-zinc-700/40">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Status breakdown</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {[{ l: 'Active', v: b.activeAssets, c: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                                    { l: 'Maint.', v: b.maintenanceAssets, c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                                    { l: 'Retired', v: b.retiredAssets, c: 'text-red-400 bg-red-500/10 border-red-500/20' }].map(s => (
                                        <div key={s.l} className={`flex-1 border rounded-xl p-2 text-center ${s.c}`}>
                                            <p className="text-sm font-bold">{s.v}</p>
                                            <p className="text-[10px] opacity-70">{s.l}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-6 space-y-4">
                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">By Category</p>
                            <div className="flex items-center gap-4">
                                <Donut categories={b.categories} total={b.assetCount} />
                                <div className="flex-1 space-y-2">
                                    {b.categories.map((cat, i) => (
                                        <div key={cat.name}>
                                            <div className="flex justify-between mb-0.5">
                                                <span className="text-slate-400 text-[10px]">
                                                    {CAT_ICON[cat.name] || '📦'} {cat.name}
                                                </span>
                                                <span className="text-slate-300 text-[10px] font-bold">{cat.count}</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${(cat.count / b.assetCount) * 100}%`,
                                                        background: CAT_COLORS[i % CAT_COLORS.length]
                                                    }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Asset list */}
                    {locationAssets.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                                Assets in this Location
                                <span className="ml-2 text-slate-500 normal-case font-normal">({locationAssets.length} tracked)</span>
                            </p>
                            <div className="space-y-2">
                                {locationAssets.map(a => (
                                    <div key={a.id}
                                        className="flex items-center justify-between p-3.5
                                                   bg-zinc-800/40 border border-zinc-700/40
                                                   rounded-xl hover:border-zinc-600 transition-colors">
                                        <div className="min-w-0 pr-4">
                                            <p className="text-slate-200 text-sm font-medium truncate">{a.name}</p>
                                            <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                                                {a.id} · {a.category} · {a.assignedTo}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`w-2 h-2 rounded-full ${a.health === 'Good' ? 'bg-emerald-400' :
                                                a.health === 'Fair' ? 'bg-amber-400' : 'bg-red-400'}`} />
                                            <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border
                                                ${a.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                    a.status === 'Maintenance' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                        'text-slate-400 bg-zinc-800 border-zinc-700'}`}>
                                                {a.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Campus totals bar ───────────────────────────────────────── */
function TopBar() {
    const total = buildings.reduce((s, b) => s + b.assetCount, 0);
    const totalVal = buildings.reduce((s, b) => s + b.totalValue, 0);
    const alerts = buildings.reduce((s, b) => s + b.alertCount, 0);
    const allGood = buildings.reduce((s, b) => s + b.health.Good, 0);
    const health = Math.round((allGood / total) * 100);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { icon: <Package size={16} />, label: 'Total Assets', val: total.toLocaleString(), c: 'blue' },
                { icon: <DollarSign size={16} />, label: 'Total Value', val: fmt(totalVal), c: 'emerald' },
                { icon: <AlertTriangle size={16} />, label: 'Active Alerts', val: alerts, c: alerts > 0 ? 'red' : 'slate' },
                { icon: <Activity size={16} />, label: 'Fleet Health', val: `${health}%`, c: 'emerald' },
            ].map(k => {
                const palette = {
                    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    red: 'text-red-400 bg-red-500/10 border-red-500/20',
                    slate: 'text-slate-400 bg-zinc-800/60 border-zinc-700/50',
                };
                return (
                    <div key={k.label} className={`flex items-center gap-4 border rounded-2xl px-5 py-4 ${palette[k.c]}`}>
                        <div className={palette[k.c].split(' ')[0]}>{k.icon}</div>
                        <div>
                            <p className="text-[11px] text-slate-400">{k.label}</p>
                            <p className={`text-xl font-bold ${palette[k.c].split(' ')[0]}`}>{k.val}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function CampusMap() {
    const [selected, setSelected] = useState(null);

    return (
        <div className="space-y-6 pb-10">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-white text-2xl font-bold tracking-tight">Campus Digital Twin</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Select any building to explore its full asset intelligence
                    </p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold
                                bg-emerald-500/10 border border-emerald-500/20
                                px-4 py-2 rounded-full self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Tracking Active
                </div>
            </div>

            {/* KPI bar */}
            <TopBar />

            {/* Map — always full width */}
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin size={14} className="text-cyan-400" />
                        <span>{buildings.length} buildings · {buildings.reduce((s, b) => s + b.assetCount, 0)} assets</span>
                    </div>
                    <div className="flex items-center gap-5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-700 border border-white/20 inline-block" />
                            Click to inspect
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
                            Alert active
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-white/30 border border-white/60 inline-block" />
                            Asset count
                        </span>
                    </div>
                </div>

                <div className="p-5">
                    <div className="overflow-x-auto">
                        <div className="min-w-[520px]">
                            <svg viewBox="0 0 580 460" className="w-full">
                                {/* background */}
                                <rect x="10" y="10" width="560" height="440" rx="20"
                                    fill="#0d1117" stroke="#1e293b" strokeWidth="1" strokeDasharray="12 6" />

                                {/* roads */}
                                {/* vertical */}
                                <rect x="205" y="10" width="10" height="440" fill="#161d2a" />
                                <rect x="355" y="10" width="10" height="440" fill="#161d2a" />
                                {/* horizontal */}
                                <rect x="10" y="170" width="560" height="10" fill="#161d2a" />
                                <rect x="10" y="310" width="560" height="10" fill="#161d2a" />

                                {/* road dashes */}
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <rect key={`vd${i}`} x="209" y={20 + i * 35} width="2" height="20" rx="1" fill="#334155" opacity="0.5" />
                                ))}
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <rect key={`hd${i}`} x={20 + i * 35} y="162" width="20" height="2" rx="1" fill="#334155" opacity="0.5" />
                                ))}
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <rect key={`hd2-${i}`} x={20 + i * 35} y="292" width="20" height="2" rx="1" fill="#334155" opacity="0.5" />
                                ))}

                                {/* compass */}
                                <circle cx="543" cy="30" r="13" fill="#161d2a" stroke="#334155" strokeWidth="1" />
                                <text x="543" y="34" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">N</text>

                                <text x="290" y="447" textAnchor="middle" fill="#1e293b" fontSize="9">
                                    CITIL Campus · Zone Map v3.1
                                </text>

                                {/* Buildings */}
                                {buildings.map(b => {
                                    const isSel = selected?.id === b.id;
                                    return (
                                        <g key={b.id} onClick={() => setSelected(b)} className="cursor-pointer">

                                            {/* Glow ring when selected */}
                                            {isSel && (
                                                <rect x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} rx="13"
                                                    fill="none" stroke={b.color} strokeWidth="2.5" strokeOpacity="0.6" />
                                            )}

                                            {/* Building body */}
                                            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="9"
                                                fill={b.color}
                                                fillOpacity={isSel ? 0.9 : 0.55}
                                                stroke={isSel ? '#ffffff40' : '#ffffff12'}
                                                strokeWidth="1.5"
                                            />

                                            {/* Window grid */}
                                            {[0, 1, 2].filter(r => b.h > 60 + r * 18).map(row =>
                                                [0, 1, 2, 3].filter(c => b.w > 30 + c * 22).map(col => (
                                                    <rect key={`w-${b.id}-${row}-${col}`}
                                                        x={b.x + 10 + col * 22} y={b.y + b.h - 20 - row * 18}
                                                        width="12" height="11" rx="2.5"
                                                        fill="#ffffff" fillOpacity={0.1} />
                                                ))
                                            ).flat()}

                                            {/* Name */}
                                            <text x={b.x + b.w / 2} y={b.y + b.h / 2 - (b.name.split(' ').length > 2 ? 8 : 4)}
                                                textAnchor="middle" fill="white" fontSize="9.5" fontWeight="700">
                                                {b.name.split(' ').slice(0, 2).join(' ')}
                                            </text>
                                            {b.name.split(' ').length > 2 && (
                                                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 6}
                                                    textAnchor="middle" fill="white" fontSize="9.5" fontWeight="700">
                                                    {b.name.split(' ').slice(2).join(' ')}
                                                </text>
                                            )}

                                            {/* Asset count badge */}
                                            <circle cx={b.x + b.w - 14} cy={b.y + 14} r="13"
                                                fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                            <text x={b.x + b.w - 14} y={b.y + 18}
                                                textAnchor="middle" fill="white" fontSize="9" fontWeight="800">
                                                {b.assetCount}
                                            </text>

                                            {/* Alert pulse */}
                                            {b.alertCount > 0 && (
                                                <>
                                                    <circle cx={b.x + 14} cy={b.y + 14} r="9" fill="#ef4444">
                                                        <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                                                    </circle>
                                                    <text x={b.x + 14} y={b.y + 18} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">!</text>
                                                </>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location overview table */}
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800/40 flex items-center gap-2">
                    <BarChart3 size={15} className="text-slate-400" />
                    <h3 className="text-white font-semibold text-sm">All Locations</h3>
                    <span className="ml-auto text-xs text-slate-500">{buildings.length} buildings · click to inspect</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500 text-xs border-b border-zinc-800/40">
                                {['Location', 'Zone', 'Assets', 'Value', 'Active', 'Health', 'Alerts', 'Last Audit'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {buildings.map(b => {
                                const hp = Math.round((b.health.Good / b.assetCount) * 100);
                                return (
                                    <tr key={b.id} onClick={() => setSelected(b)}
                                        className={`hover:bg-zinc-800/30 transition-colors cursor-pointer
                                                   ${selected?.id === b.id ? 'bg-zinc-800/40' : ''}`}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
                                                <span className="text-slate-200 font-semibold whitespace-nowrap">{b.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                                                style={{ color: b.color, background: `${b.color}20`, border: `1px solid ${b.color}40` }}>
                                                {b.zone}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono font-bold text-slate-200">{b.assetCount}</td>
                                        <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">{fmt(b.totalValue)}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-emerald-400 font-semibold">{b.activeAssets}</span>
                                            <span className="text-slate-600">/{b.assetCount}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${hp}%` }} />
                                                </div>
                                                <span className="text-slate-400 text-xs">{hp}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {b.alertCount > 0
                                                ? <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                                                    <AlertTriangle size={11} />{b.alertCount}
                                                </span>
                                                : <span className="text-slate-600">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{b.lastAudit}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Drawer (modal overlay, doesn't touch map) */}
            {selected && <StatsDrawer b={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
