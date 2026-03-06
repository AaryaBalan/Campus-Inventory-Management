import React, { useState } from 'react';
import { FileText, CheckCircle, Download } from 'lucide-react';

const TEMPLATES = [
    { id: 'asset-audit', title: 'Asset Audit Report', desc: 'Full inventory of all assets with status, location, and movement history', estimated: '~2-3 min', category: 'Asset' },
    { id: 'procurement', title: 'Procurement Summary', desc: 'Purchase requests, approvals, vendor performance, and spend analysis', estimated: '~1-2 min', category: 'Finance' },
    { id: 'compliance', title: 'Compliance & Regulatory', desc: 'Audit trail, access logs, policy compliance status', estimated: '~3-5 min', category: 'Compliance' },
    { id: 'inventory', title: 'Stock Level Report', desc: 'Current inventory levels, consumption trends, and reorder recommendations', estimated: '~1 min', category: 'Inventory' },
    { id: 'movement', title: 'Asset Movement Log', desc: 'Detailed asset transfer history with approvals and locations', estimated: '~2 min', category: 'Asset' },
    { id: 'budget', title: 'Budget Utilization', desc: 'Department-wise budget consumption vs allocation over the period', estimated: '~2 min', category: 'Finance' },
];

export default function ReportGenerator() {
    const [selected, setSelected] = useState(null);
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-12-31');
    const [format, setFormat] = useState('PDF');
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(null);

    const handleGenerate = () => {
        if (!selected) return;
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            setGenerated(selected);
        }, 2000);
    };

    const catColor = { Asset: 'bg-zinc-600/20 text-zinc-300', Finance: 'bg-emerald-500/20 text-emerald-400', Compliance: 'bg-purple-500/20 text-purple-400', Inventory: 'bg-amber-500/20 text-amber-400' };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-white text-xl font-bold">Report Generator</h1>
                <p className="text-slate-400 text-sm mt-0.5">Generate compliance, audit, and analytics reports</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template selector */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-slate-300 text-sm font-semibold">Select Report Template</h3>
                    {TEMPLATES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelected(t.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${selected === t.id ? 'bg-zinc-600/10 border-zinc-500 ring-1 ring-zinc-500/30' : 'bg-zinc-900/70 border-zinc-800/80 hover:border-slate-600'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <FileText size={15} className={selected === t.id ? 'text-zinc-300' : 'text-slate-400'} />
                                        <p className="text-slate-200 text-sm font-semibold">{t.title}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${catColor[t.category]}`}>{t.category}</span>
                                    </div>
                                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{t.desc}</p>
                                </div>
                                <div className="text-right ml-4 shrink-0">
                                    <p className="text-slate-500 text-xs">{t.estimated}</p>
                                    {selected === t.id && <CheckCircle size={16} className="text-zinc-300 mt-1 ml-auto" />}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Config panel */}
                <div className="space-y-4">
                    <h3 className="text-slate-300 text-sm font-semibold">Configuration</h3>
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                        <div>
                            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Date Range</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500/60 mb-2" />
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500/60" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Output Format</label>
                            <div className="flex gap-2">
                                {['PDF', 'XLSX', 'CSV'].map(f => (
                                    <button key={f} onClick={() => setFormat(f)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${format === f ? 'bg-zinc-700/80 border-zinc-500 text-zinc-100' : 'border-zinc-800 text-slate-400 hover:border-slate-600'}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selected && !generated && (
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : 'Generate Report'}
                            </button>
                        )}

                        {generated && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                                <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-emerald-400 text-sm font-semibold">Report Ready!</p>
                                <p className="text-slate-400 text-xs mt-1">{TEMPLATES.find(t => t.id === generated)?.title}</p>
                                <button className="mt-3 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium mx-auto transition-colors">
                                    <Download size={14} /> Download {format}
                                </button>
                                <button onClick={() => setGenerated(null)} className="mt-2 text-xs text-slate-500 hover:text-slate-400 block mx-auto transition-colors">Generate Another</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
