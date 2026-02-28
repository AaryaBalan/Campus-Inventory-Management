import React from 'react';
import { Package, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KPICard } from '../../components/ui/Card.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { assets, purchaseRequests } from '../../data/mockData.js';

export default function DepartmentDashboard() {
    const navigate = useNavigate();
    const deptAssets = assets.filter(a => a.department === 'Science');
    const myRequests = purchaseRequests.filter(p => p.department === 'Science');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Department Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Science Department · Asset & Request Overview</p>
                </div>
                <button
                    onClick={() => navigate('/procurement/request')}
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> New Request
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Dept Assets" value={deptAssets.length} subtitle="Assigned to Science" icon={<Package size={20} />} color="blue" />
                <KPICard title="Active Assets" value={deptAssets.filter(a => a.status === 'Active').length} subtitle="In use" icon={<CheckCircle size={20} />} color="green" />
                <KPICard title="Pending Requests" value={myRequests.filter(r => !['approved', 'rejected'].includes(r.status)).length} subtitle="Awaiting approval" icon={<Clock size={20} />} color="amber" />
                <KPICard title="Approved This Month" value={myRequests.filter(r => r.status === 'approved').length} subtitle="Purchase requests" icon={<CheckCircle size={20} />} color="cyan" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dept assets */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-sm">My Department Assets</h3>
                        <button onClick={() => navigate('/assets')} className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">View all <ArrowRight size={12} /></button>
                    </div>
                    <div className="space-y-2.5">
                        {deptAssets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => navigate(`/assets/${asset.id}`)}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors"
                            >
                                <div>
                                    <p className="text-slate-200 text-xs font-medium">{asset.name}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{asset.id} · {asset.location}</p>
                                </div>
                                <StatusIndicator status={asset.status} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* My purchase requests */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-sm">My Purchase Requests</h3>
                        <button onClick={() => navigate('/procurement/history')} className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">History <ArrowRight size={12} /></button>
                    </div>
                    <div className="space-y-3">
                        {myRequests.map(pr => (
                            <div key={pr.id} className="p-3 rounded-xl bg-slate-700/30 border border-zinc-800/60 hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-slate-200 text-xs font-medium">{pr.item}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{pr.id} · ₹{pr.total.toLocaleString()}</p>
                                    </div>
                                    <StatusIndicator status={pr.status} />
                                </div>
                                {/* Mini approval pipeline */}
                                <div className="flex items-center gap-1 mt-2">
                                    {pr.stages.map((s, i) => (
                                        <React.Fragment key={s.name}>
                                            <div className={`flex-1 text-center py-0.5 px-1 rounded text-[10px] font-medium
                        ${s.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    s.status === 'active' ? 'bg-zinc-600/20 text-zinc-300' :
                                                        s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-slate-700 text-slate-500'}`}>{s.name}</div>
                                            {i < pr.stages.length - 1 && <div className="w-2 h-px bg-slate-600" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
