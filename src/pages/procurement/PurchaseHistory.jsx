import React from 'react';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { purchaseRequests } from '../../data/mockData.js';
import { Download } from 'lucide-react';

export default function PurchaseHistory() {
    const completed = purchaseRequests.filter(r => ['approved', 'rejected'].includes(r.status));
    const total = completed.filter(r => r.status === 'approved').reduce((s, r) => s + r.total, 0);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-bold">Purchase History</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Completed purchase requests · ₹{total.toLocaleString()} approved this period</p>
                </div>
                <button className="flex items-center gap-2 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all">
                    <Download size={15} /> Export
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Approved', value: completed.filter(r => r.status === 'approved').length, color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5' },
                    { label: 'Rejected', value: completed.filter(r => r.status === 'rejected').length, color: 'text-red-400', border: 'border-red-500/20 bg-red-500/5' },
                    { label: 'Total Approved Value', value: `₹${total.toLocaleString()}`, color: 'text-zinc-300', border: 'border-zinc-500/20 bg-zinc-600/5' },
                ].map(c => (
                    <div key={c.label} className={`border rounded-2xl p-4 ${c.border}`}>
                        <p className="text-slate-400 text-xs">{c.label}</p>
                        <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-800/60">
                            <tr>
                                {['PR ID', 'Item', 'Department', 'Requested By', 'Qty', 'Total', 'Priority', 'Status', 'Date'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {completed.map(pr => (
                                <tr key={pr.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-4 py-3 text-zinc-300 text-xs font-mono">{pr.id}</td>
                                    <td className="px-4 py-3 text-slate-200 text-sm">{pr.item}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{pr.department}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{pr.requestedBy}</td>
                                    <td className="px-4 py-3 text-slate-300 text-sm">{pr.quantity}</td>
                                    <td className="px-4 py-3 text-slate-200 text-sm font-semibold">₹{pr.total.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium ${pr.priority === 'High' ? 'text-red-400' : pr.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>{pr.priority}</span>
                                    </td>
                                    <td className="px-4 py-3"><StatusIndicator status={pr.status} /></td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{pr.requestedDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {completed.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No completed requests</div>}
            </div>
        </div>
    );
}
