import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { purchaseRequests as mockRequests } from '../../data/mockData.js';
import { procurementApi } from '../../utils/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { CheckCircle, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Normalizes a PR from either mock format or backend format into one shape.
 * Mock:    { id, item, quantity, unitCost, total, requestedBy, requestedDate, department, stages[] }
 * Backend: { requestId, items[], totalEstimatedCost, requesterName, createdAt, requesterDepartment }
 */
function normalize(pr) {
    const isMock = !pr.requestId; // mock PRs use 'id', backend uses 'requestId'
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
            justification: pr.justification,
            stages: pr.stages,
            _isMock: true,
        };
    }
    // Backend shape
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
        justification: firstItem.justification || pr.notes || '',
        stages: null, // build from status
        _isMock: false,
    };
}

function derivedStages(norm) {
    if (norm.stages) return norm.stages; // use mock's rich stages
    const s = norm.status;
    return [
        { name: 'Requested', status: 'done' },
        { name: 'Dept Head', status: s === 'Draft' ? 'active' : ['Pending-DeptHead'].includes(s) ? 'active' : 'done' },
        { name: 'Finance', status: ['Draft', 'Pending-DeptHead'].includes(s) ? 'pending' : ['Pending-Finance'].includes(s) ? 'active' : s === 'Rejected' ? 'rejected' : 'done' },
        { name: 'Approved', status: s === 'Approved' ? 'done' : s === 'Rejected' ? 'rejected' : 'pending' },
    ];
}

export default function ApprovalQueue() {
    const { currentUser } = useApp();
    const location = useLocation();
    const [apiRequests, setApiRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(
        location.state?.successMsg ? { message: location.state.successMsg, type: 'approve' } : null
    );
    const [actionLoading, setActionLoading] = useState({});

    const showToast = (message, type = 'approve') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await procurementApi.list();
            setApiRequests(Array.isArray(data) ? data : data.requests || []);
        } catch (err) {
            setError(err.message || 'Failed to load requests from server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    useEffect(() => {
        if (location.state?.successMsg) {
            window.history.replaceState({}, '');
            setTimeout(() => setToast(null), 3500);
        }
    }, []);

    // Merge: mock data first (as baseline demo), then real API requests on top
    const allNormalized = [
        ...mockRequests.map(normalize),
        ...apiRequests.map(normalize),
    ];
    const pending = allNormalized.filter(r =>
        !['approved', 'rejected', 'Approved', 'Rejected'].includes(r.status)
    );

    // AppContext stores display names: 'Admin', 'Finance', 'Department Head'
    const canApprove = ['Admin', 'Finance', 'Department Head'].includes(currentUser?.role);

    const handleAction = async (norm, action) => {
        if (norm._isMock) {
            showToast(`This is a demo request — connect to backend to approve/reject.`, 'reject');
            return;
        }
        const id = norm._id;
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            if (action === 'approve') {
                await procurementApi.approve(id, { action: 'approve', comments: '' });
            } else {
                const reason = 'Rejected by approver';
                await procurementApi.reject(id, { action: 'reject', comments: reason, reason });
            }
            showToast(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, action);
            await fetchRequests();
        } catch (err) {
            showToast(err.message || `Failed to ${action}`, 'reject');
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-bold">Approval Queue</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {pending.length} request{pending.length !== 1 ? 's' : ''} pending review
                    </p>
                </div>
                <button onClick={fetchRequests} disabled={loading}
                    className="flex items-center gap-2 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-sm transition-all disabled:opacity-40">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium
          ${toast.type === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.type === 'approve' ? <CheckCircle size={16} /> : <X size={16} />}
                    {toast.message}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm">
                    <AlertCircle size={15} /> {error} — showing demo data only.
                </div>
            )}

            <div className="space-y-4">
                {allNormalized.map(norm => {
                    const stages = derivedStages(norm);
                    const isActing = actionLoading[norm._id];
                    const isPending = !['approved', 'rejected', 'Approved', 'Rejected'].includes(norm.status);

                    return (
                        <div key={norm._id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="text-zinc-300 font-mono text-sm font-bold">{norm._id}</span>
                                        {norm._isMock && (
                                            <span className="text-[10px] bg-zinc-700/60 text-zinc-400 px-1.5 py-0.5 rounded-md border border-zinc-700">demo</span>
                                        )}
                                        <StatusIndicator status={norm.status} />
                                        <span className={`text-xs font-medium ${norm.priority === 'High' ? 'text-red-400' : norm.priority === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                                            {norm.priority} Priority
                                        </span>
                                    </div>
                                    <h3 className="text-white font-semibold text-sm">{norm.itemName}</h3>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {norm.department} · {norm.quantity} units · ₹{(norm.unitCost || 0).toLocaleString('en-IN')} each · <span className="text-zinc-300 font-semibold">₹{(norm.totalCost || 0).toLocaleString('en-IN')} total</span>
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1">
                                        Requested by: {norm.requestedBy} · {norm.createdAt ? new Date(norm.createdAt).toLocaleDateString('en-IN') : ''}
                                    </p>
                                    {norm.justification && (
                                        <p className="text-slate-400 text-xs mt-2 italic">"{norm.justification}"</p>
                                    )}
                                </div>

                                {isPending && !norm._isMock && (() => {
                                    const role = currentUser?.role;
                                    const s = norm.status;
                                    return (
                                        role === 'Admin' ||
                                        (role === 'Department Head' && s === 'Pending-DeptHead') ||
                                        (role === 'Finance' && s === 'Pending-Finance')
                                    );
                                })() && (
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleAction(norm, 'approve')}
                                                disabled={isActing}
                                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors">
                                                {isActing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={15} />} Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(norm, 'reject')}
                                                disabled={isActing}
                                                className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors">
                                                {isActing ? <Loader2 size={14} className="animate-spin" /> : <X size={15} />} Reject
                                            </button>
                                        </div>
                                    )}
                            </div>

                            {/* Approval stage pipeline */}
                            <div className="mt-4 flex items-center gap-1">
                                {stages.map((stage, i) => (
                                    <React.Fragment key={stage.name}>
                                        <div className={`flex-1 flex flex-col items-center p-2 rounded-xl border text-center
                        ${stage.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                                stage.status === 'active' ? 'bg-zinc-600/10 border-zinc-500/30' :
                                                    stage.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                                                        'bg-zinc-900 border-zinc-800'}`}>
                                            <span className={`text-[10px] font-semibold ${stage.status === 'done' ? 'text-emerald-400' :
                                                stage.status === 'active' ? 'text-zinc-300' :
                                                    stage.status === 'rejected' ? 'text-red-400' : 'text-slate-500'}`}>
                                                {stage.name}
                                            </span>
                                            {stage.date && <span className="text-[9px] text-slate-500 mt-0.5">{stage.date}</span>}
                                            {stage.status === 'rejected' && stage.reason && (
                                                <span className="text-[9px] text-red-400 mt-0.5 italic truncate max-w-[80px]" title={stage.reason}>{stage.reason}</span>
                                            )}
                                        </div>
                                        {i < stages.length - 1 && (
                                            <div className={`w-4 h-px shrink-0 ${stage.status === 'done' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex justify-center py-4 text-slate-500 gap-2 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading live requests...
                    </div>
                )}
            </div>
        </div>
    );
}
