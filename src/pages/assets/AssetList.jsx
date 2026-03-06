import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode, Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { assetApi } from '../../utils/api.js';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Networking', 'Lab Equipment',
    'HVAC', 'Security', 'Electrical', 'Appliances', 'Computing', 'Instruments',
    'AV Equipment', 'Accessories', 'Equipment', 'Chemicals'];
const STATUSES = ['All', 'Active', 'Maintenance', 'Under Maintenance', 'Retired'];

export default function AssetList() {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('All');
    const [selected, setSelected] = useState([]);

    const fetchAssets = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await assetApi.list({ limit: 100 });
            setAssets(data.assets || []);
        } catch (e) {
            setError(e.message || 'Failed to load assets.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAssets(); }, []);

    // Normalize field names — backend uses assetId, currentLocation, updatedAt
    const normalized = assets.map(a => ({
        ...a,
        id: a.assetId || a.id,
        location: a.currentLocation || a.location || '—',
        department: a.currentDepartment || a.department || '—',
        lastUpdated: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString('en-IN') : '—',
    }));

    const filtered = normalized.filter(a => {
        const s = search.toLowerCase();
        const matchSearch = !s ||
            (a.name || '').toLowerCase().includes(s) ||
            (a.id || '').toLowerCase().includes(s) ||
            (a.assignedTo || '').toLowerCase().includes(s);
        const matchCat = category === 'All' || a.category === category;
        const matchStatus = status === 'All' || a.status === status;
        return matchSearch && matchCat && matchStatus;
    });

    const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(a => a.id));

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-white text-xl font-bold">Asset Registry</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {loading ? 'Loading…' : `${assets.length} total assets · ${filtered.length} shown`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAssets}
                        title="Refresh"
                        className="p-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                        <RefreshCw size={15} />
                    </button>
                    <button
                        onClick={() => navigate('/scanner')}
                        className="flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        <QrCode size={15} /> Scan QR
                    </button>
                    <button
                        onClick={() => navigate('/assets/register')}
                        className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus size={15} /> Register Asset
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={15} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button onClick={fetchAssets} className="text-xs text-red-400 hover:text-red-300 underline">Retry</button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, ID, assignee…" className="flex-1" />
                <div className="flex gap-2">
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-zinc-500/60 cursor-pointer"
                    >
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-zinc-500/60 cursor-pointer"
                    >
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button className="flex items-center gap-1.5 border border-zinc-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl text-sm transition-all">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Bulk actions */}
            {selected.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-zinc-600/10 border border-zinc-500/30 rounded-xl">
                    <span className="text-zinc-300 text-sm font-medium">{selected.length} selected</span>
                    <button className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition-colors">Bulk Transfer</button>
                    <button className="text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">Bulk Retire</button>
                    <button onClick={() => setSelected([])} className="ml-auto text-xs text-slate-400 hover:text-slate-200">Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-800/80">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === filtered.length && filtered.length > 0}
                                        onChange={toggleAll}
                                        className="accent-blue-500 cursor-pointer"
                                    />
                                </th>
                                {['Asset ID', 'Name', 'Category', 'Location', 'Assigned To', 'Status', 'Last Updated', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {loading ? (
                                /* Skeleton rows */
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="w-4 h-4 bg-zinc-800 rounded" /></td>
                                        {[90, 140, 80, 110, 100, 60, 70, 60].map((w, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3.5 bg-zinc-800 rounded" style={{ width: w }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? null : (
                                filtered.map(asset => (
                                    <tr key={asset.id} className="hover:bg-slate-700/20 transition-colors group">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(asset.id)}
                                                onChange={() => toggleSelect(asset.id)}
                                                className="accent-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="text-zinc-300 text-xs font-mono hover:text-zinc-200 cursor-pointer"
                                                onClick={() => navigate(`/assets/${asset.id}`)}
                                            >
                                                {asset.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-200 text-sm font-medium whitespace-nowrap">{asset.name || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{asset.category || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{asset.location}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{asset.assignedTo || '—'}</td>
                                        <td className="px-4 py-3"><StatusIndicator status={asset.status} /></td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{asset.lastUpdated}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/assets/${asset.id}`)}
                                                    className="text-xs text-zinc-300 hover:text-zinc-200"
                                                >
                                                    View
                                                </button>
                                                <span className="text-slate-600">·</span>
                                                <button className="text-xs text-slate-400 hover:text-slate-200">Transfer</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center py-16 gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Plus size={20} className="text-zinc-500" />
                        </div>
                        <p className="text-slate-300 font-medium text-sm">
                            {assets.length === 0 ? 'No assets registered yet' : 'No assets match your filters'}
                        </p>
                        <p className="text-slate-600 text-xs">
                            {assets.length === 0
                                ? 'Register your first asset manually or extract from a bill'
                                : 'Try clearing your search or filter'}
                        </p>
                        {assets.length === 0 && (
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={() => navigate('/assets/register')}
                                    className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl transition-colors"
                                >
                                    Register Asset
                                </button>
                                <button
                                    onClick={() => navigate('/bills')}
                                    className="text-xs border border-zinc-700 hover:border-zinc-600 text-slate-400 hover:text-white px-4 py-2 rounded-xl transition-colors"
                                >
                                    Extract from Bill
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!loading && (
                    <div className="px-4 py-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-slate-500 text-xs">
                            Showing {filtered.length} of {assets.length} assets
                        </span>
                        <button
                            onClick={fetchAssets}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <RefreshCw size={11} /> Refresh
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
