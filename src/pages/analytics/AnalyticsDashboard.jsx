import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { AlertTriangle, Brain } from 'lucide-react';
import { consumptionHistory, demandForecast, forecastData } from '../../data/mockData.js';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl">
            <p className="text-slate-300 text-xs mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
        </div>
    );
};

const forecastWithPrediction = [
    ...consumptionHistory,
    { month: 'Feb', stationery: null, forecast_stationery: 65 },
    { month: 'Mar', stationery: null, forecast_stationery: 55 },
    { month: 'Apr', stationery: null, forecast_stationery: 40 },
];

export default function AnalyticsDashboard() {
    const [horizon, setHorizon] = useState('30');

    const fd = forecastData.find(f => f.period === `${horizon} Days`);
    const anomalies = [
        { id: 1, asset: 'AST-0006 Microscope', type: 'Unauthorized Movement', risk: 'High', time: '45m ago', color: 'red' },
        { id: 2, asset: 'INV-001 Cartridges', type: 'Rapid Consumption Spike', risk: 'Medium', time: '2h ago', color: 'amber' },
        { id: 3, asset: 'AST-0003 Projector', type: 'Unusual Downtime Pattern', risk: 'Low', time: '1d ago', color: 'blue' },
    ];

    const riskColors = { High: 'text-red-400 bg-red-500/10 border-red-500/20', Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', Low: 'text-zinc-300 bg-zinc-600/10 border-zinc-500/20' };
    const actionColors = { 'Reorder Now': 'text-amber-400 bg-amber-500/20', 'Monitor': 'text-zinc-300 bg-zinc-600/20', 'OK': 'text-emerald-400 bg-emerald-500/20', 'Urgent': 'text-red-400 bg-red-500/20', 'Critical': 'text-red-400 bg-red-600/20', 'Reorder Soon': 'text-amber-400 bg-amber-500/20' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-bold">Predictive Analytics</h1>
                    <p className="text-slate-400 text-sm mt-0.5">AI-powered shortage forecasting & anomaly detection</p>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                    <Brain size={14} className="text-purple-400" />
                    <span className="text-purple-400 text-xs font-medium">AI Active</span>
                </div>
            </div>

            {/* Forecast horizon selector */}
            <div className="flex gap-2">
                {['30', '60', '90'].map(h => (
                    <button key={h} onClick={() => setHorizon(h)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${horizon === h ? 'bg-purple-600 text-white border border-purple-500' : 'bg-zinc-900 text-slate-400 border border-zinc-800 hover:border-slate-600 hover:text-slate-200'}`}>
                        {h}-Day Forecast
                    </button>
                ))}
            </div>

            {/* Shortage prediction cards */}
            {fd && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[['stationery', 'Stationery'], ['lab', 'Lab Supplies'], ['hygiene', 'Hygiene']].map(([key, label]) => {
                        const catData = fd[key];
                        const isBad = ['Critical', 'Urgent', 'Reorder Now'].includes(catData.action);
                        return (
                            <div key={key} className={`border rounded-2xl p-5 ${isBad ? 'bg-red-500/5 border-red-500/20' : catData.action === 'Reorder Soon' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-slate-300 text-sm font-semibold">{label}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${actionColors[catData.action] || 'text-slate-400 bg-slate-700'}`}>{catData.action}</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{catData.predicted}<span className="text-slate-400 text-sm ml-1">units</span></p>
                                <p className="text-slate-400 text-xs mt-1">Predicted in {horizon} days</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${catData.confidence}%` }} />
                                    </div>
                                    <span className="text-slate-400 text-xs">{catData.confidence}%</span>
                                </div>
                                <p className="text-slate-500 text-[10px] mt-1">Confidence score</p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Consumption trend + forecast */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Consumption Trend & Forecast Overlay</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={forecastWithPrediction}>
                            <defs>
                                <linearGradient id="stGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine x="Jan" stroke="#475569" strokeDasharray="4 2" />
                            <Area type="monotone" dataKey="stationery" stroke="#0891b2" fill="url(#stGrad)" strokeWidth={2} name="Stationery (Actual)" connectNulls={false} />
                            <Area type="monotone" dataKey="forecast_stationery" stroke="#7c3aed" fill="none" strokeWidth={2} strokeDasharray="6 3" name="Forecast" connectNulls={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Demand forecast */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Category Demand Forecast</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={demandForecast} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="current" name="Current" fill="#0891b2" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="forecast" name="Forecast" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Anomaly detection */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-amber-400" />
                    <h3 className="text-white font-semibold text-sm">Anomaly Detection Alerts</h3>
                </div>
                <div className="space-y-3">
                    {anomalies.map(a => (
                        <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border ${riskColors[a.risk]}`}>
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={15} />
                                <div>
                                    <p className="text-slate-200 text-sm font-medium">{a.type}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{a.asset}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold">{a.risk} Risk</span>
                                <span className="text-slate-500 text-xs">{a.time}</span>
                                <button className="text-xs border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-white px-2.5 py-1 rounded-lg transition-all">Investigate</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
