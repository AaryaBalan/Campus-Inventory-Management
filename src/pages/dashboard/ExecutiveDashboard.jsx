import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Shield, Clock, DollarSign } from 'lucide-react';
import { KPICard } from '../../components/ui/Card.jsx';
import { kpis, spendTrend } from '../../data/mockData.js';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl">
            <p className="text-slate-300 text-xs">{label}</p>
            {payload.map((p, i) => <p key={i} className="text-xs font-bold mt-1" style={{ color: p.color }}>₹{(p.value / 1000).toFixed(0)}K</p>)}
        </div>
    );
};

export default function ExecutiveDashboard() {
    const radialData = [
        { name: 'Traceability', value: kpis.assetTraceability, fill: '#0891b2' },
        { name: 'Procurement Eff.', value: kpis.procurementEfficiency, fill: '#059669' },
        { name: 'Compliance', value: kpis.complianceScore, fill: '#7c3aed' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-white text-2xl font-bold">Executive Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Strategic KPIs & financial overview</p>
            </div>

            {/* Hero KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Asset Traceability" value={`${kpis.assetTraceability}%`} subtitle="Target: 100%" icon={<Shield size={20} />} color="cyan" trend="up" trendValue="+2.3% vs last quarter" />
                <KPICard title="Reconciliation Time" value={`${kpis.reconciliationTime}hrs`} subtitle="Target: 48hrs" icon={<Clock size={20} />} color="green" trend="up" trendValue="-28hrs vs last quarter" />
                <KPICard title="Procurement Efficiency" value={`${kpis.procurementEfficiency}%`} subtitle="Approval SLA met" icon={<TrendingUp size={20} />} color="blue" />
                <KPICard title="Total Asset Value" value="₹4.25Cr" subtitle="Active inventory" icon={<DollarSign size={20} />} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* KPI radial */}
                <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Performance Scorecard</h3>
                    {radialData.map(d => (
                        <div key={d.name} className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-300 text-xs">{d.name}</span>
                                <span className="text-white text-xs font-bold">{d.value}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full transition-all" style={{ width: `${d.value}%`, background: d.fill }} />
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        {[
                            ['₹42.5L', 'Inventory Value'],
                            ['1,284', 'Total Assets'],
                            ['6', 'Departments'],
                        ].map(([val, label]) => (
                            <div key={label} className="bg-slate-700/40 rounded-xl p-3 text-center">
                                <p className="text-cyan-400 font-bold text-sm">{val}</p>
                                <p className="text-slate-400 text-[10px] mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Spend trend */}
                <div className="lg:col-span-3 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">6-Month Procurement Spend</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={spendTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="spend" stroke="#0891b2" strokeWidth={2.5} dot={{ fill: '#0891b2', r: 4 }} name="Spend" />
                            <Line type="monotone" dataKey="budget" stroke="#334155" strokeWidth={1.5} strokeDasharray="6 4" dot={false} name="Budget" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Impact metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Financial Leakage Reduction', value: '35%', desc: 'vs. pre-CITRA baseline', color: 'emerald' },
                    { title: 'Reconciliation Time Saved', value: '72hrs → 44hrs', desc: '-39% reduction achieved', color: 'blue' },
                    { title: 'Asset Visibility Improvement', value: '61% → 97.8%', desc: 'Traceability increase', color: 'purple' },
                ].map(m => (
                    <div key={m.title} className={`bg-${m.color}-500/10 border border-${m.color}-500/20 rounded-2xl p-5`}>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{m.title}</p>
                        <p className={`text-${m.color}-400 text-2xl font-bold`}>{m.value}</p>
                        <p className="text-slate-500 text-xs mt-1">{m.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
