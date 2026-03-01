import React, { useState, useEffect, useCallback } from 'react';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { purchaseRequests as mockRequests } from '../../data/mockData.js';
import { procurementApi } from '../../utils/api.js';
import { Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/** Normalize mock + backend format to one consistent shape */
function normalize(pr) {
    const isMock = !pr.requestId;
    if (isMock) {
        return {
            _id: pr.id,
            itemName: pr.item,
            quantity: pr.quantity,
            unitCost: pr.unitCost,
            totalCost: pr.total,
            priority: pr.priority,
            status: pr.status,
            department: pr.department,
            requestedBy: pr.requestedBy,
            createdAt: pr.requestedDate,
            _isMock: true,
        };
    }
    const firstItem = (pr.items || [])[0] || {};
    return {
        _id: pr.requestId,
        itemName: firstItem.itemName || '—',
        quantity: firstItem.quantity || 0,
        unitCost: firstItem.estimatedUnitCost || 0,
        totalCost: pr.totalEstimatedCost || 0,
        priority: pr.priority || 'Medium',
        status: pr.status || 'Draft',
        department: pr.requesterDepartment || pr.notes?.replace('Department: ', '') || '—',
        requestedBy: pr.requesterName || '—',
        createdAt: pr.createdAt,
        _isMock: false,
    };
}

export default function PurchaseHistory() {
    const [apiRequests, setApiRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await procurementApi.list();
            setApiRequests(Array.isArray(data) ? data : data.requests || []);
        } catch (err) {
            setError(err.message || 'Failed to load from server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // Merge mock + API, show all
    const all = [
        ...mockRequests.map(normalize),
        ...apiRequests.map(normalize),
    ];

    const completed = all.filter(r =>
        ['approved', 'rejected', 'Approved', 'Rejected'].includes(r.status)
    );
    const approvedTotal = all
        .filter(r => ['approved', 'Approved'].includes(r.status))
        .reduce((s, r) => s + (r.totalCost || 0), 0);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-bold">Purchase History</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        All purchase requests · ₹{approvedTotal.toLocaleString('en-IN')} approved this period
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchHistory} disabled={loading}
                        className="flex items-center gap-2 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-sm transition-all disabled:opacity-40">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all">
                        <Download size={15} /> Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Approved', value: all.filter(r => ['approved', 'Approved'].includes(r.status)).length, color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5' },
                    { label: 'Rejected', value: all.filter(r => ['rejected', 'Rejected'].includes(r.status)).length, color: 'text-red-400', border: 'border-red-500/20 bg-red-500/5' },
                    { label: 'Total Approved Value', value: `₹${approvedTotal.toLocaleString('en-IN')}`, color: 'text-zinc-300', border: 'border-zinc-500/20 bg-zinc-600/5' },
                ].map(c => (
                    <div key={c.label} className={`border rounded-2xl p-4 ${c.border}`}>
                        <p className="text-slate-400 text-xs">{c.label}</p>
                        <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm">
                    <AlertCircle size={15} /> {error} — showing demo data.
                </div>
            )}

            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-800/60">
                            <tr>
                                {['PR ID', 'Item', 'Department', 'Requested By', 'Qty', 'Unit Cost', 'Total', 'Priority', 'Status', 'Date'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {all.map(pr => (
                                <tr key={pr._id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-4 py-3 text-zinc-300 text-xs font-mono">
                                        {pr._id}
                                        {pr._isMock && (
                                            <span className="ml-1.5 text-[9px] bg-zinc-700/60 text-zinc-500 px-1 py-0.5 rounded border border-zinc-700">demo</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-200 text-sm">{pr.itemName}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{pr.department}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{pr.requestedBy}</td>
                                    <td className="px-4 py-3 text-slate-300 text-sm">{pr.quantity}</td>
                                    <td className="px-4 py-3 text-slate-300 text-sm">₹{(pr.unitCost || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-slate-200 text-sm font-semibold">₹{(pr.totalCost || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium ${pr.priority === 'High' ? 'text-red-400' : pr.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                                            {pr.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3"><StatusIndicator status={pr.status} /></td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                        {pr.createdAt ? (isNaN(Date.parse(pr.createdAt)) ? pr.createdAt : new Date(pr.createdAt).toLocaleDateString('en-IN')) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && all.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">No purchase requests yet</div>
                )}
                {loading && (
                    <div className="flex justify-center py-5 text-slate-500 gap-2 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading live requests...
                    </div>
                )}
            </div>
        </div>
    );
}
