import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { inventoryItems, consumptionHistory } from '../../data/mockData.js';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl">
            <p className="text-slate-300 text-xs mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
        </div>
    );
};

export default function StockLevels() {
    const [autoReorder, setAutoReorder] = useState({ 'INV-001': true, 'INV-004': true, 'INV-002': false });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-white text-xl font-bold">Inventory Stock Levels</h1>
                <p className="text-slate-400 text-sm mt-0.5">Real-time monitoring with automated reorder triggers</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', value: inventoryItems.length, color: 'text-zinc-300', bg: 'border-zinc-500/20 bg-zinc-600/5' },
                    { label: 'Critical', value: inventoryItems.filter(i => i.status === 'critical').length, color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/5' },
                    { label: 'Low Stock', value: inventoryItems.filter(i => i.status === 'low').length, color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
                    { label: 'In Stock', value: inventoryItems.filter(i => i.status === 'ok').length, color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5' },
                ].map(c => (
                    <div key={c.label} className={`border rounded-2xl p-4 ${c.bg}`}>
                        <p className="text-slate-400 text-xs">{c.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Consumption chart */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">Consumption History – Last 6 Months</h3>
                    <TrendingDown size={16} className="text-slate-400" />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={consumptionHistory}>
                        <defs>
                            {[['stationery', '#0891b2'], ['lab', '#7c3aed'], ['hygiene', '#059669'], ['electronics', '#d97706']].map(([k, c]) => (
                                <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        {[['stationery', '#0891b2', 'Stationery'], ['lab', '#7c3aed', 'Lab'], ['hygiene', '#059669', 'Hygiene'], ['electronics', '#d97706', 'Electronics']].map(([k, c, name]) => (
                            <Area key={k} type="monotone" dataKey={k} stroke={c} fill={`url(#g-${k})`} strokeWidth={1.5} name={name} />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Stock grid */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800/60 flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm">Stock Level Grid</h3>
                    <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-800/60">
                            <tr>
                                {['Item', 'Category', 'Stock Level', 'Qty', 'Reorder At', 'Status', 'Auto Reorder'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {inventoryItems.map(item => {
                                const pct = Math.min((item.quantity / item.maxLevel) * 100, 100);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-slate-200 text-sm font-medium">{item.name}</p>
                                            <p className="text-slate-500 text-xs">{item.id}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{item.category}</span>
                                        </td>
                                        <td className="px-4 py-3 w-32">
                                            <div className="w-full bg-slate-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${item.status === 'ok' ? 'bg-emerald-500' : item.status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-slate-500 text-[10px] mt-1">{pct.toFixed(0)}% of max</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-200 text-sm font-semibold">{item.quantity} <span className="text-slate-500 text-xs font-normal">{item.unit}</span></td>
                                        <td className="px-4 py-3 text-slate-400 text-sm">{item.reorderLevel}</td>
                                        <td className="px-4 py-3"><StatusIndicator status={item.status} /></td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setAutoReorder(a => ({ ...a, [item.id]: !a[item.id] }))}
                                                className={`relative w-10 h-5 rounded-full transition-colors ${autoReorder[item.id] ? 'bg-emerald-600' : 'bg-slate-600'}`}
                                            >
                                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autoReorder[item.id] ? 'left-5' : 'left-0.5'}`} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
