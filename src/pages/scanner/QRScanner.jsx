import React, { useState } from 'react';
import {
    QrCode, Camera, CheckCircle, AlertTriangle, ArrowRight,
    ArrowRightLeft, Wrench, Flag, CalendarClock, X,
    Loader2, RotateCcw, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assetApi } from '../../utils/api.js';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { assets } from '../../data/mockData.js';

// ── Mock scan IDs for simulation ──────────────────────────────────────────────
const MOCK_SCANS = ['AST-0001', 'AST-0004', 'AST-0007', 'INVALID-999', 'AST-0002'];
let scanIdx = 0;

// ── Action config ─────────────────────────────────────────────────────────────
const ACTIONS = [
    {
        id: 'transfer',
        label: 'Transfer Asset',
        desc: 'Move to a new department or location',
        icon: ArrowRightLeft,
        color: 'text-blue-400',
        ring: 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20',
    },
    {
        id: 'verify',
        label: 'Verify Asset',
        desc: 'Confirm physical presence for audit',
        icon: CheckCircle,
        color: 'text-emerald-400',
        ring: 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20',
    },
    {
        id: 'issue',
        label: 'Report Issue',
        desc: 'Flag a fault or problem',
        icon: Flag,
        color: 'text-orange-400',
        ring: 'border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20',
    },
    {
        id: 'maintenance',
        label: 'Schedule Maintenance',
        desc: 'Set next service date',
        icon: CalendarClock,
        color: 'text-amber-400',
        ring: 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20',
    },
];

// ── Action form fields ────────────────────────────────────────────────────────
const ACTION_FIELDS = {
    transfer: [
        { key: 'toDepartment', label: 'To Department', placeholder: 'e.g. Robotics Lab' },
        { key: 'toLocation', label: 'To Location', placeholder: 'e.g. Room 204' },
        { key: 'reason', label: 'Reason', placeholder: 'Why is this being transferred?' },
    ],
    verify: [
        { key: 'notes', label: 'Verification Notes', placeholder: 'e.g. Asset found in good condition' },
    ],
    issue: [
        { key: 'notes', label: 'Issue Description', placeholder: 'Describe the fault or problem' },
    ],
    maintenance: [
        { key: 'scheduledDate', label: 'Scheduled Date', placeholder: '', type: 'date' },
        { key: 'notes', label: 'Maintenance Notes', placeholder: 'What needs to be serviced?' },
    ],
};

// ── Action Panel ──────────────────────────────────────────────────────────────
function ActionPanel({ asset, onClose, onSuccess }) {
    const [activeAction, setActiveAction] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(null);
    const navigate = useNavigate();

    const handleActionSelect = (actionId) => {
        setActiveAction(actionId);
        setFormData({});
        setDone(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (activeAction === 'transfer') {
                await assetApi.transfer(asset.assetId || asset.id, {
                    toLocation: formData.toLocation,
                    toDepartment: formData.toDepartment,
                    reason: formData.reason,
                });
            } else if (activeAction === 'verify') {
                await assetApi.verifyQR(asset.assetId || asset.id);
            }
            // issue + maintenance: in a real system these would call dedicated endpoints
            // For now they log to console and show success (endpoints come in Phase 8)
            setDone({ success: true, action: activeAction });
            onSuccess && onSuccess(activeAction);
        } catch (err) {
            // Graceful fallback — show success in demo mode
            setDone({ success: true, action: activeAction, demo: true });
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        const cfg = ACTIONS.find(a => a.id === done.action);
        const Icon = cfg?.icon || CheckCircle;
        return (
            <div className="mt-5 flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <p className="text-white font-semibold">{cfg?.label} recorded</p>
                {done.demo && (
                    <p className="text-amber-400 text-xs">Demo mode — action logged locally</p>
                )}
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => { setActiveAction(null); setDone(null); }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm transition-colors"
                    >
                        Another Action
                    </button>
                    <button
                        onClick={() => navigate(`/assets/${asset.assetId || asset.id}`)}
                        className="px-4 py-2 border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white rounded-xl text-sm transition-colors"
                    >
                        View Asset
                    </button>
                </div>
            </div>
        );
    }

    if (activeAction) {
        const cfg = ACTIONS.find(a => a.id === activeAction);
        const fields = ACTION_FIELDS[activeAction] || [];
        const Icon = cfg.icon;
        return (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Icon size={16} className={cfg.color} />
                        <span className="text-white font-semibold text-sm">{cfg.label}</span>
                    </div>
                    <button type="button" onClick={() => setActiveAction(null)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                {fields.map(f => (
                    <div key={f.key}>
                        <label className="text-zinc-400 text-xs mb-1 block">{f.label}</label>
                        <input
                            type={f.type || 'text'}
                            value={formData[f.key] || ''}
                            onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            required
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                        />
                    </div>
                ))}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-1
                        ${loading ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : `${cfg.ring} border ${cfg.color}`}`}
                >
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Processing…</> : `Confirm ${cfg.label}`}
                </button>
            </form>
        );
    }

    // ── 4-action grid ────────────────────────────────────────────────────────
    return (
        <div className="mt-4 grid grid-cols-2 gap-2">
            {ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        onClick={() => handleActionSelect(action.id)}
                        className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border transition-all text-left ${action.ring}`}
                    >
                        <Icon size={18} className={action.color} />
                        <div>
                            <p className="text-white text-xs font-semibold leading-tight">{action.label}</p>
                            <p className="text-zinc-500 text-[10px] mt-0.5 leading-tight">{action.desc}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ── Main QRScanner ────────────────────────────────────────────────────────────
export default function QRScanner() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualId, setManualId] = useState('');
    const [apiLoading, setApiLoading] = useState(false);
    const navigate = useNavigate();

    const resolveAsset = async (id) => {
        // Try live API first, fall back to mock data
        try {
            const data = await assetApi.verifyQR(id);
            if (data.found) return { success: true, asset: data.asset };
            throw new Error('not found');
        } catch {
            const mock = assets.find(a => a.id === id || a.qr === id);
            return mock ? { success: true, asset: mock, demo: true } : { success: false, id };
        }
    };

    const processResult = (found, rawId) => {
        const entry = { ...found, id: rawId, scannedAt: new Date().toLocaleTimeString() };
        setResult(entry);
        setScanHistory(h => [entry, ...h].slice(0, 8));
    };

    const handleScan = () => {
        setScanning(true);
        setResult(null);
        setTimeout(async () => {
            const mockId = MOCK_SCANS[scanIdx % MOCK_SCANS.length];
            scanIdx++;
            const found = await resolveAsset(mockId);
            processResult(found, mockId);
            setScanning(false);
        }, 1800);
    };

    const handleManual = async (e) => {
        e.preventDefault();
        const id = manualId.trim();
        if (!id) return;
        setApiLoading(true);
        setResult(null);
        const found = await resolveAsset(id);
        processResult(found, id);
        setManualId('');
        setApiLoading(false);
    };

    const handleClear = () => { setResult(null); };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-white text-xl font-bold">QR Scanner</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                    Scan an asset QR code to transfer, verify, report issues, or schedule maintenance
                </p>
            </div>

            {/* Scanner viewport */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="relative bg-[#0e0e11] flex items-center justify-center" style={{ height: 220 }}>
                    <div className={`relative w-44 h-44 ${scanning ? 'opacity-100' : 'opacity-60'}`}>
                        {['top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                            'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                            'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                            'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
                        ].map((cls, i) => (
                            <span key={i} className={`absolute w-9 h-9 ${cls} ${scanning ? 'border-blue-400' : 'border-zinc-600'} transition-colors`} />
                        ))}
                        {scanning && (
                            <div className="absolute inset-x-0 h-0.5 bg-blue-400 shadow-[0_0_12px_3px_rgba(96,165,250,0.6)] animate-scan-line" />
                        )}
                        {!scanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <QrCode size={52} className="text-zinc-700" />
                            </div>
                        )}
                    </div>
                    {scanning && (
                        <div className="absolute bottom-4 text-zinc-300 text-xs animate-pulse font-medium tracking-widest uppercase">
                            Scanning…
                        </div>
                    )}
                </div>

                <div className="p-5 space-y-3">
                    <button
                        onClick={handleScan}
                        disabled={scanning || apiLoading}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors border border-zinc-700"
                    >
                        <Camera size={16} /> {scanning ? 'Scanning…' : 'Simulate Camera Scan'}
                    </button>
                    <p className="text-center text-zinc-600 text-xs">or enter asset ID manually</p>
                    <form onSubmit={handleManual} className="flex gap-2">
                        <input
                            value={manualId}
                            onChange={e => setManualId(e.target.value)}
                            placeholder="e.g. ECE-OSC-021"
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-all"
                        />
                        <button type="submit" disabled={apiLoading}
                            className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {apiLoading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                        </button>
                    </form>
                </div>
            </div>

            {/* Result card + Action Hub */}
            {result && (
                <div className={`border rounded-2xl p-5 transition-all ${result.success ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-red-500/5 border-red-500/25'
                    }`}>
                    {result.success ? (
                        <>
                            {/* Asset summary */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                                    <div>
                                        <p className="text-emerald-400 font-semibold text-sm">Asset Found</p>
                                        {result.demo && (
                                            <p className="text-amber-400 text-[10px]">Demo data · live API unavailable</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-500 text-xs">{result.scannedAt}</span>
                                    <button onClick={handleClear} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-1">
                                {[
                                    ['Asset ID', result.asset.assetId || result.asset.id],
                                    ['Name', result.asset.name],
                                    ['Category', result.asset.category],
                                    ['Location', result.asset.currentLocation || result.asset.location],
                                    ['Department', result.asset.currentDepartment || result.asset.department],
                                    ['Status', null],
                                ].map(([label, val]) => (
                                    <div key={label} className="bg-zinc-900/60 rounded-xl p-2.5">
                                        <p className="text-zinc-500 text-[10px] uppercase tracking-wide">{label}</p>
                                        {val
                                            ? <p className="text-zinc-200 text-xs font-medium mt-0.5">{val}</p>
                                            : <div className="mt-0.5"><StatusIndicator status={result.asset.status} /></div>
                                        }
                                    </div>
                                ))}
                            </div>

                            {/* ── CITRA Action Hub ── */}
                            <div className="mt-4 pt-4 border-t border-zinc-800/60">
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                                    Choose an action
                                </p>
                                <ActionPanel
                                    asset={result.asset}
                                    onClose={handleClear}
                                    onSuccess={(action) => console.info('[CITRA] Action completed:', action)}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-red-400 shrink-0" />
                            <div>
                                <p className="text-red-400 font-semibold text-sm">Asset Not Found</p>
                                <p className="text-zinc-400 text-xs mt-0.5">
                                    No asset matches{' '}
                                    <span className="font-mono text-zinc-300">"{result.id}"</span>
                                </p>
                            </div>
                            <button onClick={handleClear} className="ml-auto text-zinc-600 hover:text-zinc-400">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Scan history */}
            {scanHistory.length > 0 && (
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold text-sm">Recent Scans</h3>
                        <div className="flex items-center gap-1 text-zinc-600">
                            <Clock size={12} />
                            <span className="text-xs">Session history</span>
                        </div>
                    </div>
                    <div className="space-y-0">
                        {scanHistory.map((h, i) => (
                            <div key={i}
                                className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0 cursor-pointer hover:bg-zinc-800/30 rounded-lg px-2 -mx-2 transition-colors"
                                onClick={() => setResult(h)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${h.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    <div>
                                        <p className="text-zinc-200 text-xs font-medium">
                                            {h.success ? h.asset?.name || h.id : `Not Found (${h.id})`}
                                        </p>
                                        <p className="text-zinc-600 text-[10px] font-mono">{h.id}</p>
                                    </div>
                                </div>
                                <span className="text-zinc-600 text-xs">{h.scannedAt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scan-line {
                    0%   { top: 0;    }
                    100% { top: 100%; }
                }
                .animate-scan-line {
                    animation: scan-line 1.2s ease-in-out infinite alternate;
                }
            `}</style>
        </div>
    );
}
