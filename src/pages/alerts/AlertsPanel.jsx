import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Search, X } from 'lucide-react';
import { alerts } from '../../data/mockData.js';

const TABS = ['All', 'Critical', 'Warning', 'Info', 'Resolved'];
const iconMap = { critical: <AlertTriangle size={16} className="text-red-400" />, warning: <AlertCircle size={16} className="text-amber-400" />, info: <Info size={16} className="text-zinc-300" /> };
const bgMap = { critical: 'border-red-500/30 bg-red-500/5', warning: 'border-amber-500/30 bg-amber-500/5', info: 'border-zinc-500/30 bg-zinc-600/5' };
const stripMap = { critical: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-zinc-600' };

export default function AlertsPanel() {
    const [tab, setTab] = useState('All');
    const [alertList, setAlertList] = useState(alerts);
    const [search, setSearch] = useState('');

    const filtered = alertList.filter(a => {
        const matchTab = tab === 'All' ? a.status !== 'resolved' :
            tab === 'Critical' ? a.type === 'critical' && a.status !== 'resolved' :
                tab === 'Warning' ? a.type === 'warning' && a.status !== 'resolved' :
                    tab === 'Info' ? a.type === 'info' && a.status !== 'resolved' :
                        a.status === 'resolved';
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const updateStatus = (id, status) => setAlertList(al => al.map(a => a.id === id ? { ...a, status } : a));

    const counts = {
        All: alertList.filter(a => a.status !== 'resolved').length,
        Critical: alertList.filter(a => a.type === 'critical' && a.status !== 'resolved').length,
        Warning: alertList.filter(a => a.type === 'warning' && a.status !== 'resolved').length,
        Info: alertList.filter(a => a.type === 'info' && a.status !== 'resolved').length,
        Resolved: alertList.filter(a => a.status === 'resolved').length,
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-white text-xl font-bold">Alerts & Notifications</h1>
                <p className="text-slate-400 text-sm mt-0.5">{counts.All} active alerts · {counts.Critical} critical</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-1 overflow-x-auto">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        {t}
                        {counts[t] > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${t === 'Critical' ? 'bg-red-500 text-white' :
                                    t === 'Warning' ? 'bg-amber-500 text-white' :
                                        t === 'Resolved' ? 'bg-emerald-500 text-white' :
                                            'bg-slate-600 text-slate-200'}`}>{counts[t]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-zinc-500/60 transition-all" />
            </div>

            {/* Alert cards */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Check size={40} className="mx-auto mb-3 text-emerald-400 opacity-50" />
                        <p className="text-sm">No alerts in this category</p>
                    </div>
                ) : filtered.map(alert => (
                    <div key={alert.id} className={`flex gap-0 border rounded-2xl overflow-hidden transition-all ${bgMap[alert.type]}`}>
                        <div className={`w-1 shrink-0 ${stripMap[alert.type]}`} />
                        <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">{iconMap[alert.type]}</div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-slate-100 text-sm font-semibold">{alert.title}</p>
                                            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{alert.category}</span>
                                            {alert.status === 'acknowledged' && (
                                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Acknowledged</span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{alert.description}</p>
                                        <p className="text-slate-500 text-xs mt-2">{alert.timestamp}</p>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-1.5 shrink-0">
                                    {alert.status === 'open' && (
                                        <button onClick={() => updateStatus(alert.id, 'acknowledged')}
                                            className="text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap">
                                            Acknowledge
                                        </button>
                                    )}
                                    {alert.status !== 'resolved' && (
                                        <button onClick={() => updateStatus(alert.id, 'resolved')}
                                            className="text-xs border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all">
                                            Resolve
                                        </button>
                                    )}
                                    {alert.actionRequired && (
                                        <button className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                            Investigate
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
