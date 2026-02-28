import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Package, AlertTriangle, Clock, CheckCircle, TrendingUp, Activity, ArrowRight, Boxes } from 'lucide-react';
import { KPICard } from '../../components/ui/Card.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { kpis, categoryDistribution, assets, purchaseRequests } from '../../data/mockData.js';

const COLORS = ['#0891b2', '#059669', '#7c3aed', '#d97706', '#dc2626', '#1e3a8a', '#6b7280'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl">
            <p className="text-slate-300 text-xs font-medium">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-bold mt-1" style={{ color: p.fill || p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? `₹${(p.value / 1000).toFixed(0)}K` : p.value}</p>
            ))}
        </div>
    );
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const recentMovements = [
        { asset: 'AST-0001 Dell Laptop', action: 'Transfer', from: 'IT Store', to: 'Admin Block', time: '2h ago', user: 'Rahul K.' },
        { asset: 'AST-0006 Microscope', action: 'Alert', from: 'Science Lab', to: '???', time: '45m ago', user: 'System' },
        { asset: 'AST-0011 Server', action: 'Registration', from: 'New', to: 'Server Room', time: '1d ago', user: 'IT Team' },
        { asset: 'AST-0003 Projector', action: 'Maintenance', from: 'Lecture Hall', to: 'Service Center', time: '2d ago', user: 'Ramesh' },
    ];

    return (
        <div className="space-y-6">
            {/* Page title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Campus-wide asset overview · Updated just now</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live Data
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Assets" value={kpis.totalAssets.toLocaleString()} subtitle={`${kpis.activeAssets} active`} icon={<Package size={20} />} color="blue" trend="up" trendValue="+12 this month" />
                <KPICard title="Low Stock Alerts" value={kpis.lowStockItems} subtitle={`${kpis.criticalStock} critical`} icon={<AlertTriangle size={20} />} color="amber" trend="up" trendValue="↑2 since yesterday" />
                <KPICard title="Pending Approvals" value={kpis.pendingApprovals} subtitle="Avg. 18h wait time" icon={<Clock size={20} />} color="red" />
                <KPICard title="Compliance Score" value={`${kpis.complianceScore}%`} subtitle="Audit ready" icon={<CheckCircle size={20} />} color="green" trend="up" trendValue="+2% this quarter" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Category bar chart */}
                <div className="lg:col-span-3 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-white font-semibold text-sm">Asset Category Distribution</h3>
                            <p className="text-slate-400 text-xs mt-0.5">By count across campus</p>
                        </div>
                        <Boxes size={18} className="text-slate-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={categoryDistribution} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={45} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Assets">
                                {categoryDistribution.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Asset status pie */}
                <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-white font-semibold text-sm">Asset Status</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Current distribution</p>
                        </div>
                        <Activity size={18} className="text-slate-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={[{ name: 'Active', value: 1198 }, { name: 'Maintenance', value: 62 }, { name: 'Retired', value: 24 }]}
                                cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                                <Cell fill="#059669" />
                                <Cell fill="#d97706" />
                                <Cell fill="#6b7280" />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                        {[['Active', 1198, '#059669'], ['Maintenance', 62, '#d97706'], ['Retired', 24, '#6b7280']].map(([label, val, color]) => (
                            <div key={label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                    <span className="text-slate-400 text-xs">{label}</span>
                                </div>
                                <span className="text-slate-200 text-xs font-semibold">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent movements */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-sm">Recent Asset Movements</h3>
                        <button onClick={() => navigate('/compliance/audit')} className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">View all <ArrowRight size={12} /></button>
                    </div>
                    <div className="space-y-3">
                        {recentMovements.map((m, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${m.action === 'Alert' ? 'bg-red-500/20 text-red-400' :
                                            m.action === 'Transfer' ? 'bg-zinc-600/20 text-zinc-300' :
                                                m.action === 'Registration' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-amber-500/20 text-amber-400'
                                        }`}>{m.action[0]}</div>
                                    <div>
                                        <p className="text-slate-200 text-xs font-medium">{m.asset}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{m.from} → {m.to}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-slate-400 text-xs">{m.time}</p>
                                    <p className="text-slate-500 text-xs">{m.user}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending approvals */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-sm">Pending Approvals</h3>
                        <button onClick={() => navigate('/procurement/approvals')} className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">Manage <ArrowRight size={12} /></button>
                    </div>
                    <div className="space-y-3">
                        {purchaseRequests.filter(p => !['approved', 'rejected'].includes(p.status)).map(pr => (
                            <div key={pr.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                <div>
                                    <p className="text-slate-200 text-xs font-medium">{pr.id}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{pr.item} · {pr.department}</p>
                                    <p className="text-slate-400 text-xs">₹{pr.total.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <StatusIndicator status={pr.status} />
                                    <p className={`text-xs mt-1.5 font-medium ${pr.priority === 'High' ? 'text-red-400' : pr.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>{pr.priority} Priority</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
