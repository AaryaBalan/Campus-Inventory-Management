import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { RefreshCw, AlertTriangle, TrendingDown, Loader2, CalendarClock, TrendingUp, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { inventoryApi, analyticsApi } from '../../utils/api.js';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl">
            <p className="text-slate-300 text-xs mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
        </div>
    );
};

export default function StockLevels() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [autoReorder, setAutoReorder] = useState({});
    const [timing, setTiming] = useState([]);
    const [timingLoading, setTimingLoading] = useState(true);
    const [timingOpen, setTimingOpen] = useState(true);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await inventoryApi.list({ limit: 100 });
            setItems(data.items || []);
        } catch (e) {
            setError(e.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTiming = useCallback(async () => {
        setTimingLoading(true);
        try {
            const data = await analyticsApi.reorderTiming();
            setTiming(data.recommendations || []);
        } catch {
            setTiming([]);
        } finally {
            setTimingLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); fetchTiming(); }, [fetchItems, fetchTiming]);

    // Normalise backend status ('In-Stock','Low','Critical') → ui tokens
    const uiStatus = (s) => s === 'In-Stock' ? 'ok' : s === 'Low' ? 'low' : 'critical';

    const total = items.length;
    const critical = items.filter(i => i.status === 'Critical').length;
    const low = items.filter(i => i.status === 'Low').length;
    const inStock = items.filter(i => i.status === 'In-Stock').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-xl font-bold">Inventory Stock Levels</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Real-time monitoring with automated reorder triggers</p>
                </div>
                <button
                    onClick={fetchItems}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', value: total, color: 'text-zinc-300', bg: 'border-zinc-500/20 bg-zinc-600/5' },
                    { label: 'Critical', value: critical, color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/5' },
                    { label: 'Low Stock', value: low, color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
                    { label: 'In Stock', value: inStock, color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5' },
                ].map(c => (
                    <div key={c.label} className={`border rounded-2xl p-4 ${c.bg}`}>
                        <p className="text-slate-400 text-xs">{c.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${c.color}`}>{loading ? '—' : c.value}</p>
                    </div>
                ))}
            </div>

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                    <AlertTriangle size={15} className="text-red-400" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* CITRA: Reorder Timing Panel */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setTimingOpen(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <CalendarClock size={16} className="text-blue-400" />
                        <h3 className="text-white font-semibold text-sm">Reorder Timing Recommendations</h3>
                        {timing.filter(t => t.urgency === 'Critical').length > 0 && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                                {timing.filter(t => t.urgency === 'Critical').length} Critical
                            </span>
                        )}
                    </div>
                    {timingOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                </button>

                {timingOpen && (
                    <div className="border-t border-zinc-800/60">
                        {timingLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 size={20} className="animate-spin text-zinc-500" />
                            </div>
                        ) : timing.length === 0 ? (
                            <div className="text-center py-10 text-zinc-600 text-sm">
                                No reorder recommendations — all items have sufficient stock.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800/50">
                                {timing.map(rec => {
                                    const urgencyStyle = {
                                        Critical: 'border-red-500/40 bg-red-500/5 text-red-400',
                                        High: 'border-orange-500/40 bg-orange-500/5 text-orange-400',
                                        Medium: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
                                        Low: 'border-zinc-500/30 bg-zinc-500/5 text-zinc-400',
                                    }[rec.urgency] || 'border-zinc-700 text-zinc-400';

                                    const velocityIcon = rec.velocityTrend === 'Accelerating'
                                        ? <TrendingUp size={11} className="text-red-400" />
                                        : rec.velocityTrend === 'Decelerating'
                                            ? <TrendingDown size={11} className="text-emerald-400" />
                                            : <Minus size={11} className="text-zinc-500" />;

                                    return (
                                        <div key={rec.inventoryId} className="flex items-center gap-4 px-5 py-4">
                                            {/* Urgency ring */}
                                            <div className={`shrink-0 w-14 h-14 rounded-xl border flex flex-col items-center justify-center gap-0.5 ${urgencyStyle}`}>
                                                <span className="text-lg font-bold leading-none">
                                                    {rec.daysUntilOrder === 0 ? '!' : rec.daysUntilOrder}
                                                </span>
                                                <span className="text-[9px] uppercase tracking-wider opacity-70">
                                                    {rec.daysUntilOrder === 0 ? 'Order Now' : 'days'}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-zinc-100 text-sm font-semibold truncate">{rec.itemName}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${urgencyStyle}`}>
                                                        {rec.urgency}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                                        {velocityIcon} {rec.velocityTrend}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-500 text-xs mt-0.5">
                                                    Order by <span className="text-zinc-300">{rec.recommendedOrderDate}</span>
                                                    {' · '}Stock out <span className="text-zinc-300">{rec.estimatedStockoutDate}</span>
                                                    {' · '}{rec.currentQuantity} {rec.unit} remaining
                                                </p>
                                            </div>

                                            {/* Quantity guidance */}
                                            <div className="shrink-0 text-right hidden sm:block">
                                                <p className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">Order Qty</p>
                                                <p className="text-zinc-200 text-xs font-mono">
                                                    <span className="text-zinc-500">{rec.orderQuantity.min}</span>
                                                    {' – '}
                                                    <span className="text-blue-300 font-bold">{rec.orderQuantity.optimal}</span>
                                                    {' – '}
                                                    <span className="text-zinc-500">{rec.orderQuantity.max}</span>
                                                </p>
                                                <p className="text-zinc-600 text-[10px]">min · optimal · max</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stock grid */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800/60">
                    <h3 className="text-white font-semibold text-sm">Stock Level Grid</h3>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-zinc-500" />
                    </div>
                ) : items.length === 0 && !error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                        <p className="text-sm">No inventory items found.</p>
                        <p className="text-xs mt-1">Run the seed script to populate sample data.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-zinc-800/60">
                                <tr>
                                    {['Item', 'Category', 'Stock Level', 'Qty', 'Reorder At', 'Status', 'Auto Reorder'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-medium whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {items.map(item => {
                                    const qty = item.currentQuantity ?? 0;
                                    const max = item.maxLevel || 1;
                                    const pct = Math.min((qty / max) * 100, 100);
                                    const st = uiStatus(item.status);
                                    return (
                                        <tr key={item.inventoryId} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-slate-200 text-sm font-medium">{item.itemName}</p>
                                                <p className="text-slate-500 text-xs">{item.inventoryId}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{item.category}</span>
                                            </td>
                                            <td className="px-4 py-3 w-32">
                                                <div className="w-full bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${st === 'ok' ? 'bg-emerald-500' : st === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="text-slate-500 text-[10px] mt-1">{pct.toFixed(0)}% of max</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-200 text-sm font-semibold">
                                                {qty} <span className="text-slate-500 text-xs font-normal">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">{item.reorderLevel}</td>
                                            <td className="px-4 py-3"><StatusIndicator status={st} /></td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setAutoReorder(a => ({ ...a, [item.inventoryId]: !a[item.inventoryId] }))}
                                                    className={`relative w-10 h-5 rounded-full transition-colors ${autoReorder[item.inventoryId] ? 'bg-emerald-600' : 'bg-slate-600'}`}
                                                >
                                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autoReorder[item.inventoryId] ? 'left-5' : 'left-0.5'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

