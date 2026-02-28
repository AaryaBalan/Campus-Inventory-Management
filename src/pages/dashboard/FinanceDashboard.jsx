import React from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, Clock, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { KPICard } from '../../components/ui/Card.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { kpis, spendTrend, purchaseRequests } from '../../data/mockData.js';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl">
            <p className="text-slate-300 text-xs font-medium mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
                    {p.name}: ₹{(p.value / 1000).toFixed(0)}K
                </p>
            ))}
        </div>
    );
};

export default function FinanceDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-white text-2xl font-bold">Finance Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Budget allocation & procurement spend overview</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Monthly Budget" value="₹9.0L" subtitle="FY 2024-25 Q3" icon={<DollarSign size={20} />} color="blue" />
                <KPICard title="Monthly Spend" value={`₹${(kpis.monthlySpend / 1000).toFixed(0)}K`} subtitle={`${kpis.budgetUtilization}% utilized`} icon={<TrendingUp size={20} />} color="amber" />
                <KPICard title="Pending Approvals" value={kpis.pendingApprovals} subtitle="Need finance review" icon={<Clock size={20} />} color="red" />
                <KPICard title="Approved This Month" value="PR-12" subtitle="₹18.5L total" icon={<CheckCircle size={20} />} color="green" />
            </div>

            {/* Budget utilization bar */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Budget Utilization – Q3 FY 2024-25</h3>
                    <span className="text-amber-400 text-xs font-semibold">{kpis.budgetUtilization}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600" style={{ width: `${kpis.budgetUtilization}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-slate-400 text-xs">₹0</span>
                    <span className="text-slate-400 text-xs">₹9,00,000 (Budget)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spend Trend */}
                <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Spend vs Budget Trend</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={spendTrend}>
                            <defs>
                                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="spend" stroke="#0891b2" fill="url(#spendGrad)" strokeWidth={2} name="Actual Spend" />
                            <Area type="monotone" dataKey="budget" stroke="#334155" fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="Budget" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Dept breakdown */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Spend by Department</h3>
                    <div className="space-y-3">
                        {[
                            { dept: 'Science Dept', amount: 290000, pct: 33, color: 'bg-purple-500' },
                            { dept: 'Administration', amount: 185000, pct: 21, color: 'bg-zinc-600' },
                            { dept: 'IT Department', amount: 220000, pct: 25, color: 'bg-cyan-500' },
                            { dept: 'Library', amount: 95000, pct: 11, color: 'bg-emerald-500' },
                            { dept: 'Other', amount: 85000, pct: 10, color: 'bg-slate-500' },
                        ].map(d => (
                            <div key={d.dept}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-300 text-xs">{d.dept}</span>
                                    <span className="text-slate-400 text-xs">₹{(d.amount / 1000).toFixed(0)}K</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Approval queue */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">Finance Review Queue</h3>
                    <button className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">View All <ArrowRight size={12} /></button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left">
                                {['PR ID', 'Item', 'Department', 'Amount', 'Priority', 'Status'].map(h => (
                                    <th key={h} className="text-slate-400 text-xs font-medium pb-3 pr-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/40">
                            {purchaseRequests.slice(0, 4).map(pr => (
                                <tr key={pr.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="py-3 pr-4 text-zinc-300 text-xs font-mono">{pr.id}</td>
                                    <td className="py-3 pr-4 text-slate-200 text-xs">{pr.item}</td>
                                    <td className="py-3 pr-4 text-slate-400 text-xs">{pr.department}</td>
                                    <td className="py-3 pr-4 text-slate-200 text-xs font-medium">₹{pr.total.toLocaleString()}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`text-xs font-medium ${pr.priority === 'High' ? 'text-red-400' : pr.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>{pr.priority}</span>
                                    </td>
                                    <td className="py-3"><StatusIndicator status={pr.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
