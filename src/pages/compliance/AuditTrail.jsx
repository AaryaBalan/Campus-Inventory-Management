import React, { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import { auditEvents } from '../../data/mockData.js';

const MODULES = ['All', 'Asset', 'Inventory', 'Procurement', 'Auth', 'Alert'];
const SEVERITY = ['All', 'critical', 'warning', 'info'];
const sevVariant = { critical: 'danger', warning: 'warning', info: 'info' };

export default function AuditTrail() {
    const [search, setSearch] = useState('');
    const [module, setModule] = useState('All');
    const [sev, setSev] = useState('All');

    const filtered = auditEvents.filter(e => {
        const matchSearch = e.action.toLowerCase().includes(search.toLowerCase()) || e.user.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase());
        const matchMod = module === 'All' || e.module === module;
        const matchSev = sev === 'All' || e.severity === sev;
        return matchSearch && matchMod && matchSev;
    });

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-bold">Audit Trail</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Tamper-proof chronological activity log</p>
                </div>
                <button className="flex items-center gap-2 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all">
                    <Download size={15} /> Export Log
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, users, details..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-zinc-500/60 transition-all" />
                </div>
                <select value={module} onChange={e => setModule(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-zinc-500/60 cursor-pointer">
                    {MODULES.map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={sev} onChange={e => setSev(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-zinc-500/60 cursor-pointer">
                    {SEVERITY.map(s => <option key={s}>{s === 'All' ? 'All Severity' : s}</option>)}
                </select>
            </div>

            <div className="text-slate-400 text-xs">{filtered.length} records found</div>

            {/* Timeline */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="divide-y divide-slate-700/40">
                    {filtered.map((event, i) => (
                        <div key={event.id} className="flex gap-4 p-4 hover:bg-slate-700/20 transition-colors group">
                            {/* Left: timestamp + severity */}
                            <div className="shrink-0 w-32 text-right">
                                <p className="text-slate-400 text-xs">{event.timestamp.split(' ')[0]}</p>
                                <p className="text-slate-500 text-xs">{event.timestamp.split(' ')[1]}</p>
                            </div>

                            {/* Center: connector line */}
                            <div className="flex flex-col items-center pt-1">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${event.severity === 'critical' ? 'bg-red-500' : event.severity === 'warning' ? 'bg-amber-500' : 'bg-zinc-600'}`} />
                                {i < filtered.length - 1 && <div className="flex-1 w-px bg-slate-700/60 mt-1" />}
                            </div>

                            {/* Right: event details */}
                            <div className="flex-1 pb-3">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-slate-200 text-sm font-medium">{event.action}</p>
                                            <Badge variant={sevVariant[event.severity]} size="sm">{event.severity}</Badge>
                                            <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">{event.module}</span>
                                        </div>
                                        <p className="text-slate-400 text-xs mt-1">{event.details}</p>
                                    </div>
                                    <div className="text-right text-xs shrink-0">
                                        <p className="text-slate-300 font-medium">{event.user}</p>
                                        <p className="text-slate-500 font-mono">{event.ip}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No audit events match your filters</div>}
                </div>
            </div>
        </div>
    );
}
