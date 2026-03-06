import React, { useState } from 'react';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { purchaseRequests } from '../../data/mockData.js';
import { CheckCircle, X, MessageSquare } from 'lucide-react';

export default function ApprovalQueue() {
    const [requests, setRequests] = useState(purchaseRequests);
    const [toast, setToast] = useState(null);

    const pending = requests.filter(r => !['approved', 'rejected'].includes(r.status));

    const handleAction = (id, action) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r));
        setToast({ message: `PR ${id} ${action === 'approve' ? 'approved' : 'rejected'} successfully`, type: action });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-white text-xl font-bold">Approval Queue</h1>
                <p className="text-slate-400 text-sm mt-0.5">{pending.length} requests pending review</p>
            </div>

            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium animate-fade-in
          ${toast.type === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.type === 'approve' ? <CheckCircle size={16} /> : <X size={16} />}
                    {toast.message}
                </div>
            )}

            <div className="space-y-4">
                {requests.map(pr => (
                    <div key={pr.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-zinc-300 font-mono text-sm font-bold">{pr.id}</span>
                                    <StatusIndicator status={pr.status} />
                                    <span className={`text-xs font-medium ${pr.priority === 'High' ? 'text-red-400' : pr.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                                        {pr.priority} Priority
                                    </span>
                                </div>
                                <h3 className="text-white font-semibold text-sm">{pr.item}</h3>
                                <p className="text-slate-400 text-xs mt-1">{pr.department} · {pr.quantity} units · ₹{pr.total.toLocaleString()}</p>
                                <p className="text-slate-500 text-xs mt-1">Requested by: {pr.requestedBy} on {pr.requestedDate}</p>
                                <p className="text-slate-400 text-xs mt-2 italic">"{pr.justification}"</p>
                            </div>

                            {/* Action buttons */}
                            {!['approved', 'rejected'].includes(pr.status) && (
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAction(pr.id, 'approve')}
                                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <CheckCircle size={15} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(pr.id, 'reject')}
                                        className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <X size={15} /> Reject
                                    </button>
                                    <button className="flex items-center gap-1 border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-sm transition-all">
                                        <MessageSquare size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Approval workflow visualization */}
                        <div className="mt-4 flex items-center gap-1">
                            {pr.stages.map((stage, i) => (
                                <React.Fragment key={stage.name}>
                                    <div className={`flex-1 flex flex-col items-center p-2 rounded-xl border text-center transition-all
                    ${stage.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                            stage.status === 'active' ? 'bg-zinc-600/10 border-zinc-500/30' :
                                                stage.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                                                    'bg-zinc-900 border-zinc-800'}`}>
                                        <span className={`text-[10px] font-semibold ${stage.status === 'done' ? 'text-emerald-400' :
                                                stage.status === 'active' ? 'text-zinc-300' :
                                                    stage.status === 'rejected' ? 'text-red-400' :
                                                        'text-slate-500'}`}>{stage.name}</span>
                                        {stage.date && <span className="text-[9px] text-slate-500 mt-0.5">{stage.date}</span>}
                                        {stage.status === 'rejected' && stage.reason && (
                                            <span className="text-[9px] text-red-400 mt-0.5 italic truncate max-w-[80px]" title={stage.reason}>{stage.reason}</span>
                                        )}
                                    </div>
                                    {i < pr.stages.length - 1 && (
                                        <div className={`w-4 h-px shrink-0 ${stage.status === 'done' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
