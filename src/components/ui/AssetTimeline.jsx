import React, { useEffect, useState } from 'react';
import {
    ShoppingCart, UserCheck, ArrowRightLeft, Wrench,
    CheckCircle2, Archive, AlertTriangle, Loader2, RefreshCw, Clock,
} from 'lucide-react';
import { assetApi } from '../../utils/api.js';

// ── Event config ─────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
    Purchased: {
        icon: ShoppingCart,
        color: 'text-cyan-400',
        ring: 'border-cyan-500/50 bg-cyan-500/10',
        bar: 'bg-cyan-500/30',
        label: 'Purchased',
    },
    Assigned: {
        icon: UserCheck,
        color: 'text-purple-400',
        ring: 'border-purple-500/50 bg-purple-500/10',
        bar: 'bg-purple-500/30',
        label: 'Assigned',
    },
    Transferred: {
        icon: ArrowRightLeft,
        color: 'text-blue-400',
        ring: 'border-blue-500/50 bg-blue-500/10',
        bar: 'bg-blue-500/30',
        label: 'Transferred',
    },
    Maintenance: {
        icon: Wrench,
        color: 'text-amber-400',
        ring: 'border-amber-500/50 bg-amber-500/10',
        bar: 'bg-amber-500/30',
        label: 'Maintenance',
    },
    Verified: {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        ring: 'border-emerald-500/50 bg-emerald-500/10',
        bar: 'bg-emerald-500/30',
        label: 'Verified',
    },
    Retired: {
        icon: Archive,
        color: 'text-red-400',
        ring: 'border-red-500/50 bg-red-500/10',
        bar: 'bg-red-500/30',
        label: 'Retired',
    },
    Issue: {
        icon: AlertTriangle,
        color: 'text-orange-400',
        ring: 'border-orange-500/50 bg-orange-500/10',
        bar: 'bg-orange-500/30',
        label: 'Issue Reported',
    },
};

const DEFAULT_CONFIG = {
    icon: Clock,
    color: 'text-zinc-400',
    ring: 'border-zinc-600/50 bg-zinc-800/40',
    bar: 'bg-zinc-500/30',
    label: 'Event',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ── Mock fallback (used when API is unreachable in dev / demo) ─────────────────

const MOCK_EVENTS = [
    { eventId: '1', type: 'Purchased', timestamp: new Date(Date.now() - 86400000 * 60).toISOString(), from: null, to: 'Electronics Lab', notes: 'Initial procurement from vendor.' },
    { eventId: '2', type: 'Assigned', timestamp: new Date(Date.now() - 86400000 * 45).toISOString(), from: null, to: 'Electronics Lab', notes: 'Assigned to ECE dept.' },
    { eventId: '3', type: 'Maintenance', timestamp: new Date(Date.now() - 86400000 * 20).toISOString(), from: 'Electronics Lab', to: 'Service Centre', notes: 'Annual calibration completed.' },
    { eventId: '4', type: 'Transferred', timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), from: 'Electronics Lab', to: 'Robotics Lab', notes: 'Requested by Robotics dept.' },
    { eventId: '5', type: 'Verified', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), from: null, to: 'Robotics Lab', notes: 'Verified via QR scan during audit.' },
];

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * AssetTimeline
 *
 * Fetches and renders the CITRA lifecycle event timeline for a given asset.
 * Falls back gracefully to mock data if the API is unreachable.
 *
 * @param {string}  assetId   - The asset ID to fetch events for
 * @param {boolean} [compact] - If true, renders a condensed view (no notes, reduced padding)
 */
export default function AssetTimeline({ assetId, compact = false }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMock, setUsingMock] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await assetApi.events(assetId);
            setEvents(data.events || []);
            setUsingMock(false);
        } catch (err) {
            // Graceful fallback — the UI remains useful even without a live backend
            console.warn('[AssetTimeline] API unavailable, using mock data:', err.message);
            setEvents(MOCK_EVENTS);
            setUsingMock(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assetId) fetchEvents();
    }, [assetId]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-xs">Loading lifecycle timeline…</p>
            </div>
        );
    }

    // ── Empty ────────────────────────────────────────────────────────────────
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-600">
                <Clock size={22} />
                <p className="text-xs">No lifecycle events recorded yet.</p>
            </div>
        );
    }

    // ── Timeline ─────────────────────────────────────────────────────────────
    return (
        <div className="relative">
            {/* Demo badge */}
            {usingMock && (
                <div className="mb-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    <span className="text-amber-300 text-xs">Demo data — backend API unreachable</span>
                </div>
            )}

            {/* Refresh */}
            {!usingMock && (
                <button
                    onClick={fetchEvents}
                    className="absolute top-0 right-0 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                    title="Refresh timeline"
                >
                    <RefreshCw size={13} />
                </button>
            )}

            {/* Vertical spine */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-zinc-800" />

            <div className="space-y-0">
                {events.map((event, idx) => {
                    const cfg = EVENT_CONFIG[event.type] || DEFAULT_CONFIG;
                    const Icon = cfg.icon;
                    const isLast = idx === events.length - 1;

                    return (
                        <div key={event.eventId} className={`flex gap-4 ${compact ? 'py-3' : 'py-4'}`}>
                            {/* Icon node */}
                            <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${cfg.ring}`}>
                                <Icon size={15} className={cfg.color} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                        {/* Event type badge */}
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                                            {cfg.label}
                                        </span>

                                        {/* From → To */}
                                        {(event.from || event.to) && (
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                {event.from && (
                                                    <span className="text-zinc-400 text-xs truncate max-w-[140px]">{event.from}</span>
                                                )}
                                                {event.from && event.to && (
                                                    <ArrowRightLeft size={10} className="text-zinc-600 shrink-0" />
                                                )}
                                                {event.to && (
                                                    <span className="text-zinc-300 text-xs truncate max-w-[140px]">{event.to}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {!compact && event.notes && (
                                            <p className="text-zinc-500 text-xs mt-1 italic leading-relaxed">
                                                "{event.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-right shrink-0">
                                        <p className="text-zinc-400 text-xs whitespace-nowrap">
                                            {formatTimestamp(event.timestamp)}
                                        </p>
                                        <p className="text-zinc-600 text-[10px] mt-0.5">
                                            {relativeTime(event.timestamp)}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar accent */}
                                {!isLast && (
                                    <div className={`mt-3 h-px w-full ${cfg.bar} rounded-full`} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Event count footer */}
            <div className="mt-2 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-zinc-600 text-xs">{events.length} lifecycle event{events.length !== 1 ? 's' : ''} recorded</span>
                <span className="text-zinc-700 text-xs font-mono">CITRA Lifecycle Engine</span>
            </div>
        </div>
    );
}
