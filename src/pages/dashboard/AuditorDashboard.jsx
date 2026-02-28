import React from 'react';
import { Shield, CheckCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KPICard } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { kpis, auditEvents } from '../../data/mockData.js';

export default function AuditorDashboard() {
    const navigate = useNavigate();
    const sevColor = { critical: 'danger', warning: 'warning', info: 'info' };
    const checks = [
        { label: 'All assets have QR codes', done: true },
        { label: 'Purchase orders verified', done: true },
        { label: 'Movement logs complete', done: true },
        { label: 'Low stock items reconciled', done: false },
        { label: 'Unauthorized movement resolved', done: false },
        { label: 'Depreciation schedule updated', done: true },
    ];
    const score = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-white text-2xl font-bold">Auditor Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Compliance monitoring & audit readiness</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Audit Score" value={`${kpis.complianceScore}%`} subtitle="Excellent" icon={<Shield size={20} />} color="green" />
                <KPICard title="Open Findings" value="5" subtitle="2 critical" icon={<AlertTriangle size={20} />} color="red" />
                <KPICard title="Assets Verified" value="1,142" subtitle="of 1,284 total" icon={<CheckCircle size={20} />} color="cyan" />
                <KPICard title="Reports Generated" value="12" subtitle="This quarter" icon={<FileText size={20} />} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audit Readiness Checklist */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold text-sm">Audit Readiness Checklist</h3>
                        <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                        <div
                            className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                    <div className="space-y-2.5">
                        {checks.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/20'}`}>
                                    {c.done
                                        ? <CheckCircle size={12} className="text-emerald-400" />
                                        : <AlertTriangle size={10} className="text-red-400" />}
                                </div>
                                <span className={`text-xs ${c.done ? 'text-slate-300' : 'text-slate-400'}`}>{c.label}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/compliance/reports')}
                        className="mt-4 w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Generate Audit Report
                    </button>
                </div>

                {/* Recent audit events */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-sm">Recent Audit Events</h3>
                        <button onClick={() => navigate('/compliance/audit')} className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">Full trail <ArrowRight size={12} /></button>
                    </div>
                    <div className="space-y-2.5">
                        {auditEvents.slice(0, 6).map(e => (
                            <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-700/30 transition-colors">
                                <Badge variant={sevColor[e.severity] || 'info'} size="sm">{e.severity}</Badge>
                                <div className="min-w-0">
                                    <p className="text-slate-200 text-xs font-medium truncate">{e.action}</p>
                                    <p className="text-slate-400 text-xs truncate">{e.user} · {e.module}</p>
                                    <p className="text-slate-500 text-[10px] mt-0.5">{e.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
