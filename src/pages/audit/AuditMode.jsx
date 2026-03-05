import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardCheck, Play, X, QrCode, CheckCircle, AlertTriangle,
    Loader2, ArrowRight, ChevronDown, ChevronUp, BarChart2,
    FileText, Lock, Search,
} from 'lucide-react';
import { auditSessionsApi } from '../../utils/api.js';

// ── Grade badge ───────────────────────────────────────────────────────────────
const GRADE_STYLE = {
    A: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    B: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    C: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    D: 'text-red-400 border-red-500/40 bg-red-500/10',
};

// ── Report panel ──────────────────────────────────────────────────────────────
function ReportPanel({ report }) {
    const [open, setOpen] = useState(true);
    const gradeStyle = GRADE_STYLE[report.grade] || GRADE_STYLE.D;

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <FileText size={16} className="text-zinc-400" />
                    <span className="text-white font-semibold text-sm">Audit Report — {report.sessionId}</span>
                </div>
                {open ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
            </button>

            {open && (
                <div className="border-t border-zinc-800/60 p-5 space-y-5">
                    {/* Grade + summary stats */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl font-black shrink-0 ${gradeStyle}`}>
                            {report.grade}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                            {[
                                { label: 'Expected', value: report.expectedCount, color: 'text-zinc-300' },
                                { label: 'Verified', value: report.verifiedCount, color: 'text-emerald-400' },
                                { label: 'Missing', value: report.missingCount, color: 'text-red-400' },
                                { label: 'Coverage', value: `${report.coveragePercent}%`, color: 'text-blue-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-zinc-800/50 rounded-xl p-3">
                                    <p className="text-zinc-500 text-[10px] uppercase tracking-wide">{s.label}</p>
                                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Condition breakdown */}
                    {Object.keys(report.conditionBreakdown || {}).length > 0 && (
                        <div>
                            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Condition Breakdown</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(report.conditionBreakdown).map(([cond, count]) => (
                                    <span key={cond} className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1">
                                        {cond}: <span className="font-semibold">{count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing assets */}
                    {report.missingAssets?.length > 0 && (
                        <div>
                            <p className="text-red-400 text-xs uppercase tracking-wide font-semibold mb-2">
                                Missing Assets ({report.missingAssets.length})
                            </p>
                            <div className="space-y-1">
                                {report.missingAssets.map(a => (
                                    <div key={a.assetId} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                                        <div>
                                            <p className="text-zinc-200 text-xs font-medium">{a.name || a.assetId}</p>
                                            <p className="text-zinc-500 text-[10px] font-mono">{a.assetId}</p>
                                        </div>
                                        <p className="text-zinc-500 text-[10px]">{a.location || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main AuditMode page ───────────────────────────────────────────────────────
export default function AuditMode() {
    // Phases: setup → active → closed
    const [phase, setPhase] = useState('setup');
    const [session, setSession] = useState(null);
    const [report, setReport] = useState(null);
    const [scans, setScans] = useState([]);

    // Setup form
    const [dept, setDept] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    // Scan input
    const [manualId, setManualId] = useState('');
    const [condition, setCondition] = useState('Good');
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [closeLoading, setCloseLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastScan, setLastScan] = useState(null);

    // Past sessions
    const [pastSessions, setPastSessions] = useState([]);
    const [pastLoading, setPastLoading] = useState(true);

    useEffect(() => {
        auditSessionsApi.list()
            .then(d => setPastSessions(d.sessions || []))
            .catch(() => setPastSessions([]))
            .finally(() => setPastLoading(false));
    }, []);

    const handleStart = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const s = await auditSessionsApi.start({ department: dept, location, notes });
            setSession(s);
            setPhase('active');
        } catch (err) {
            setError(err.message || 'Failed to start session');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (e) => {
        e.preventDefault();
        const id = manualId.trim();
        if (!id || !session) return;
        setScanLoading(true);
        setError('');
        try {
            const result = await auditSessionsApi.scan(session.sessionId, { assetId: id, condition });
            setLastScan(result);
            setScans(s => [result, ...s]);
            setManualId('');
        } catch (err) {
            setError(err.message || 'Scan failed');
        } finally {
            setScanLoading(false);
        }
    };

    const handleClose = async () => {
        if (!session) return;
        setCloseLoading(true);
        try {
            const r = await auditSessionsApi.close(session.sessionId);
            setReport(r);
            setPastSessions(prev => [{ ...session, status: 'Closed', scannedCount: scans.length }, ...prev]);
            setPhase('closed');
        } catch (err) {
            setError(err.message || 'Failed to close session');
        } finally {
            setCloseLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <ClipboardCheck size={19} className="text-zinc-200" />
                </div>
                <div>
                    <h1 className="text-white text-xl font-bold">Audit Mode</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        Start a physical verification session — scan assets to mark them verified and generate a compliance report.
                    </p>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button onClick={() => setError('')} className="text-red-400/50 hover:text-red-400"><X size={13} /></button>
                </div>
            )}

            {/* ── SETUP PHASE ── */}
            {phase === 'setup' && (
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
                    <p className="text-white font-semibold text-sm">Start New Audit Session</p>
                    <form onSubmit={handleStart} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-zinc-500 text-xs uppercase tracking-widest mb-1 block">Department</label>
                                <input
                                    value={dept}
                                    onChange={e => setDept(e.target.value)}
                                    placeholder="e.g. Electronics"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-500 text-xs uppercase tracking-widest mb-1 block">Location</label>
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g. Lab 204 (optional)"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-500 text-xs uppercase tracking-widest mb-1 block">Auditor Notes</label>
                            <input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Optional context or instructions"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                            {loading ? 'Starting…' : 'Start Audit Session'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── ACTIVE PHASE ── */}
            {phase === 'active' && session && (
                <>
                    {/* Session info bar */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <div>
                                <p className="text-emerald-400 text-sm font-semibold">Session Active</p>
                                <p className="text-zinc-500 text-xs font-mono">{session.sessionId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Scanned</p>
                                <p className="text-white font-bold text-lg leading-none">{scans.length}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Expected</p>
                                <p className="text-zinc-300 font-bold text-lg leading-none">{session.expectedCount}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={closeLoading}
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                {closeLoading ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                                Close Session
                            </button>
                        </div>
                    </div>

                    {/* Scan input */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                        <p className="text-white font-semibold text-sm">Scan or Enter Asset ID</p>
                        <form onSubmit={handleScan} className="flex gap-2">
                            <input
                                value={manualId}
                                onChange={e => setManualId(e.target.value)}
                                placeholder="e.g. ECE-OSC-021"
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                                autoFocus
                            />
                            <select
                                value={condition}
                                onChange={e => setCondition(e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none"
                            >
                                {['Good', 'Fair', 'Poor', 'Damaged'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                disabled={scanLoading || !manualId.trim()}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {scanLoading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                            </button>
                        </form>

                        {/* Last scan result */}
                        {lastScan && (
                            <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${lastScan.found ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                {lastScan.found
                                    ? <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                                    : <AlertTriangle size={15} className="text-red-400 shrink-0" />
                                }
                                <div className="flex-1">
                                    <p className="text-zinc-200 text-xs font-medium">
                                        {lastScan.found ? lastScan.assetName || lastScan.assetId : `Not found: ${lastScan.assetId}`}
                                    </p>
                                    {lastScan.found && (
                                        <p className="text-zinc-500 text-[10px]">{lastScan.category} · {lastScan.currentLocation || '—'} · {lastScan.condition}</p>
                                    )}
                                </div>
                                <span className="text-zinc-600 text-[10px] font-mono">{new Date(lastScan.scannedAt).toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Scanned assets list */}
                    {scans.length > 0 && (
                        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-zinc-800/60">
                                <p className="text-white font-semibold text-sm">Verified This Session ({scans.length})</p>
                            </div>
                            <div className="divide-y divide-zinc-800/50 max-h-64 overflow-y-auto">
                                {scans.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.found ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-200 text-xs font-medium truncate">{s.assetName || s.assetId}</p>
                                            <p className="text-zinc-600 text-[10px] font-mono">{s.assetId} · {s.condition}</p>
                                        </div>
                                        <span className="text-zinc-600 text-[10px]">{new Date(s.scannedAt).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── CLOSED PHASE ── */}
            {phase === 'closed' && report && (
                <>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <CheckCircle size={15} /> Audit session closed successfully
                    </div>
                    <ReportPanel report={report} />
                    <div className="flex justify-center">
                        <button
                            onClick={() => { setPhase('setup'); setSession(null); setReport(null); setScans([]); setLastScan(null); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-all"
                        >
                            <Play size={13} /> Start Another Session
                        </button>
                    </div>
                </>
            )}

            {/* Past sessions */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold text-sm">Past Sessions</h2>
                    <span className="text-zinc-600 text-xs">{pastSessions.length} total</span>
                </div>
                {pastLoading ? (
                    <div className="flex items-center justify-center py-8 text-zinc-600">
                        <Loader2 size={18} className="animate-spin mr-2" /> Loading…
                    </div>
                ) : pastSessions.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl text-zinc-600 text-sm">
                        No audit sessions yet
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pastSessions.map(s => (
                            <div key={s.sessionId} className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl px-4 py-3 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-zinc-200 text-sm font-medium truncate">{s.department || 'All departments'}{s.location ? ` · ${s.location}` : ''}</p>
                                    <p className="text-zinc-600 text-[10px] font-mono">{s.sessionId}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-zinc-400 text-xs">{s.scannedCount} scanned</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
