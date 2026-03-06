import React, { useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { buildings, assets, registeredSystems } from '../../data/mockData.js';
import { MapPin, Filter, Monitor } from 'lucide-react';

const FILTERS = ['All', 'Electronics', 'Furniture', 'Lab Equipment', 'Networking'];

export default function CampusMap() {
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');

    const getBuildingAssets = (buildingName) =>
        assets.filter(a => a.location === buildingName && (filter === 'All' || a.category === filter));

    const getBuildingSystems = (buildingName) =>
        registeredSystems.filter(s => s.building === buildingName);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-white text-xl font-bold">Campus Digital Twin</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Click a building to view assets. Live location tracking active.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live Tracking
                    </span>
                </div>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter size={14} className="text-slate-400 shrink-0" />
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f
                            ? 'bg-zinc-700 text-white border border-zinc-500'
                            : 'bg-zinc-900 text-slate-400 border border-zinc-800 hover:border-slate-600 hover:text-slate-200'
                            }`}
                    >{f}</button>
                ))}
            </div>

            {/* Campus map SVG */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 overflow-x-auto">
                <div className="min-w-[520px]">
                    <svg viewBox="0 0 540 480" className="w-full max-w-2xl mx-auto">
                        {/* Campus boundary */}
                        <rect x="20" y="20" width="500" height="440" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" strokeDasharray="8 4" />
                        {/* Road / paths */}
                        <rect x="180" y="20" width="8" height="440" fill="#1e293b" />
                        <rect x="320" y="20" width="8" height="440" fill="#1e293b" />
                        <rect x="20" y="170" width="500" height="8" fill="#1e293b" />
                        <rect x="20" y="320" width="500" height="8" fill="#1e293b" />
                        {/* Labels */}
                        <text x="270" y="458" textAnchor="middle" fill="#475569" fontSize="10">Campus Road Network</text>

                        {/* Buildings */}
                        {buildings.map(b => {
                            const bAssets = getBuildingAssets(b.name);
                            const isSelected = selected?.id === b.id;
                            return (
                                <g key={b.id} onClick={() => setSelected(b)} className="cursor-pointer">
                                    <rect
                                        x={b.x} y={b.y} width={b.w} height={b.h}
                                        rx="8" fill={b.color}
                                        fillOpacity={isSelected ? 0.9 : 0.6}
                                        stroke={isSelected ? '#fff' : b.color}
                                        strokeWidth={isSelected ? 2 : 1}
                                        strokeOpacity={0.8}
                                    />
                                    {/* Building name */}
                                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 8} textAnchor="middle" fill="white"
                                        fontSize="10" fontWeight="600">{b.name.split(' ').length > 2 ? b.name.split(' ').slice(0, 2).join(' ') : b.name}</text>
                                    {b.name.split(' ').length > 2 && (
                                        <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{b.name.split(' ').slice(2).join(' ')}</text>
                                    )}
                                    {/* Asset count badge */}
                                    <circle cx={b.x + b.w - 12} cy={b.y + 12} r="12" fill="#1e3a8a" />
                                    <text x={b.x + b.w - 12} y={b.y + 16} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                                        {(getBuildingAssets(b.name).length || b.assetCount) + getBuildingSystems(b.name).length}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-900 border border-zinc-500/30" /><span>Selected Building</span></div>
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-cyan-400" /><span>Asset Location</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-900 border border-white text-[8px] text-white flex items-center justify-center font-bold">N</div><span>Asset Count</span></div>
            </div>

            {/* Building asset modal */}
            <Modal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                title={`${selected?.name} – Assets`}
                size="md"
            >
                {selected && (() => {
                    const bAssets = getBuildingAssets(selected.name);
                    const bSystems = getBuildingSystems(selected.name);

                    if (bAssets.length === 0 && bSystems.length === 0) {
                        return <p className="text-slate-400 text-sm py-4 text-center">No assets detected in {selected.name}.</p>;
                    }

                    return (
                        <div className="space-y-5">
                            {bAssets.length > 0 && (
                                <div>
                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">Static Assets ({bAssets.length})</p>
                                    <div className="space-y-2">
                                        {bAssets.map(a => (
                                            <div key={a.id} className="flex items-center justify-between p-3 bg-[#0e0e11]/60 border border-zinc-800 rounded-xl">
                                                <div>
                                                    <p className="text-slate-200 text-sm font-medium">{a.name}</p>
                                                    <p className="text-slate-400 text-xs mt-0.5">{a.id} · {a.category}</p>
                                                </div>
                                                <StatusIndicator status={a.status} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {bSystems.length > 0 && (
                                <div>
                                    <p className="text-emerald-500/80 text-[10px] font-bold uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                                        <Monitor size={10} /> Auto-Detected Systems ({bSystems.length})
                                    </p>
                                    <div className="space-y-2">
                                        {bSystems.map(s => (
                                            <div key={s.id} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                <div>
                                                    <p className="text-emerald-50 text-sm font-medium">{s.hostname}</p>
                                                    <p className="text-emerald-400/60 text-[10px] font-mono mt-0.5">{s.ip} · {s.mac}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                    <span className="text-emerald-400 text-[10px] font-bold uppercase">Live</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
