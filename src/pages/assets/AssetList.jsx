import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode, Download, ChevronDown } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { assets } from '../../data/mockData.js';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Networking', 'Lab Equipment', 'HVAC', 'Security', 'Electrical', 'Appliances'];
const STATUSES = ['All', 'Active', 'Maintenance', 'Retired'];

export default function AssetList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('All');
    const [selected, setSelected] = useState([]);

    const filtered = assets.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'All' || a.category === category;
        const matchStatus = status === 'All' || a.status === status;
        return matchSearch && matchCat && matchStatus;
    });

    const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(a => a.id));

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-white text-xl font-bold">Asset Registry</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{assets.length} total assets · {filtered.length} shown</p>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, ID..." className="flex-1" />
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
                            {filtered.map(asset => (
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
                                        <span className="text-zinc-300 text-xs font-mono hover:text-zinc-200 cursor-pointer" onClick={() => navigate(`/assets/${asset.id}`)}>
                                            {asset.id}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-slate-200 text-sm font-medium whitespace-nowrap">{asset.name}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{asset.category}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{asset.location}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{asset.assignedTo}</td>
                                    <td className="px-4 py-3"><StatusIndicator status={asset.status} /></td>
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{asset.lastUpdated}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => navigate(`/assets/${asset.id}`)} className="text-xs text-zinc-300 hover:text-zinc-200">View</button>
                                            <span className="text-slate-600">·</span>
                                            <button className="text-xs text-slate-400 hover:text-slate-200">Transfer</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">No assets match your filters</div>
                )}
                <div className="px-4 py-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Showing {filtered.length} of {assets.length}</span>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(p => (
                            <button key={p} className={`w-7 h-7 rounded-lg text-xs font-medium ${p === 1 ? 'bg-zinc-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{p}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
