import React, { useState } from 'react';
import { Network, Server, Shield, Wifi, Copy, CheckCheck, ChevronDown, ChevronUp, MapPin, Building2, Globe, Hash } from 'lucide-react';
import { buildingIPMappings, buildings } from '../../data/mockData.js';

// Building color map from campus map data
const buildingColorMap = Object.fromEntries(buildings.map(b => [b.id, b.color]));

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handle = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <button
            onClick={handle}
            title="Copy"
            className="ml-1.5 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all focus:outline-none"
        >
            {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
    );
}

function IPCell({ value }) {
    return (
        <span className="inline-flex items-center font-mono text-[11px] text-cyan-300 bg-cyan-500/5 border border-cyan-500/20 px-2 py-0.5 rounded-md leading-none">
            {value}
            <CopyButton text={value} />
        </span>
    );
}

function SortIcon({ col, sortBy, sortDir }) {
    if (sortBy !== col) return <ChevronDown size={11} className="text-zinc-700 ml-1" />;
    return sortDir === 'asc'
        ? <ChevronUp size={11} className="text-blue-400 ml-1" />
        : <ChevronDown size={11} className="text-blue-400 ml-1" />;
}

export default function BuildingIPMapping() {
    const [sortBy, setSortBy] = useState('vlan');
    const [sortDir, setSortDir] = useState('asc');
    const [expandedRow, setExpandedRow] = useState(null);

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const sortedData = [...buildingIPMappings].sort((a, b) => {
        const av = a[sortBy], bv = b[sortBy];
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const ThCell = ({ col, label }) => (
        <th
            onClick={() => handleSort(col)}
            className="px-5 py-3.5 text-left text-zinc-500 text-[11px] font-bold uppercase tracking-widest cursor-pointer hover:text-zinc-200 select-none whitespace-nowrap group"
        >
            <span className="flex items-center">
                {label}
                <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
            </span>
        </th>
    );

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Dashboard</span>
                        <span className="text-zinc-700 text-xs">/</span>
                        <span className="text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em]">Network Topology</span>
                    </div>
                    <h1 className="text-white text-3xl font-black tracking-tight">IP Protocol Mapping</h1>
                    <p className="text-zinc-500 text-sm mt-1.5 font-medium">Campus-wide subnet distribution and boundary configuration</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        Network Active
                    </span>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Scopes', value: '8 Subnets', icon: <Network size={18} />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                    { label: 'Map Status', value: 'Sync Active', icon: <Wifi size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                    { label: 'IP Capacity', value: '2,032 Hosts', icon: <Globe size={18} />, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
                    { label: 'Security', value: 'VLAN Segregation', icon: <Shield size={18} />, color: 'text-zinc-400', bg: 'bg-zinc-800/80', border: 'border-zinc-700/60' },
                ].map((k, i) => (
                    <div key={i} className={`bg-[#0c0c0e]/60 backdrop-blur-md border ${k.border} rounded-2xl p-4 flex items-center gap-4 transition-all hover:translate-y-[-2px]`}>
                        <div className={`p-2.5 rounded-xl ${k.bg} ${k.color}`}>{k.icon}</div>
                        <div>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{k.label}</p>
                            <p className="text-white text-lg font-bold mt-0.5">{k.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Coverage Grid */}
            <div className="bg-[#0c0c0e]/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 overflow-hidden relative">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><MapPin size={16} /></div>
                        <div>
                            <h2 className="text-zinc-100 font-bold text-sm tracking-tight">Location Coverage</h2>
                            <p className="text-zinc-500 text-[11px] font-medium">Automatic asset-to-building binding</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {buildingIPMappings.map(b => (
                        <div key={b.id} className="group relative bg-[#141416] border border-zinc-800/60 rounded-xl p-3 hover:border-zinc-600 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: buildingColorMap[b.building_id] || '#71717a' }} />
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">{b.code}</span>
                            </div>
                            <p className="text-zinc-400 text-[10px] font-bold truncate mb-0.5">{b.building_name}</p>
                            <p className="text-blue-400 font-mono text-[9px] font-bold tabular-nums tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">192.168.{b.vlan}.x</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-[#0c0c0e]/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800/80 rounded-xl text-zinc-400"><Network size={16} /></div>
                        <div>
                            <h2 className="text-zinc-100 font-bold text-sm tracking-tight">Subnet Ledger</h2>
                            <p className="text-zinc-500 text-[11px] font-medium tracking-tight">VLAN tagging and gateway allocation</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/20 border-b border-zinc-800/40">
                                <ThCell col="id" label="ID" />
                                <ThCell col="building_name" label="Building" />
                                <ThCell col="vlan" label="VLAN" />
                                <ThCell col="ip_range_start" label="Range Start" />
                                <ThCell col="ip_range_end" label="Range End" />
                                <ThCell col="gateway" label="Gateway" />
                                <ThCell col="status" label="Status" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                            {sortedData.map(b => {
                                const isExpanded = expandedRow === b.id;
                                return (
                                    <React.Fragment key={b.id}>
                                        <tr
                                            onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                                            className={`group cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-blue-500/[0.04]' : 'hover:bg-zinc-800/40'}`}
                                        >
                                            <td className="px-6 py-4.5 text-zinc-600 font-mono text-xs">{String(b.id).padStart(2, '0')}</td>
                                            <td className="px-6 py-4.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20" style={{ backgroundColor: buildingColorMap[b.building_id] || '#71717a' }} />
                                                    <span className="text-zinc-200 font-bold text-sm tracking-tight">{b.building_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5">
                                                <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 font-bold font-mono text-xs tracking-widest">{b.vlan}</span>
                                            </td>
                                            <td className="px-6 py-4.5"><IPCell value={b.ip_range_start} /></td>
                                            <td className="px-6 py-4.5"><IPCell value={b.ip_range_end} /></td>
                                            <td className="px-6 py-4.5 text-zinc-500 font-mono text-xs font-medium">{b.gateway}</td>
                                            <td className="px-6 py-4.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-[0.1em] whitespace-nowrap">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 rotate-animation transition-transform" />
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-blue-500/[0.02]">
                                                <td colSpan="7" className="px-12 py-5 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black">Subnet Mask</span>
                                                            <span className="text-zinc-200 font-mono text-xs font-bold">255.255.255.0</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black">DNS Allocation</span>
                                                            <span className="text-zinc-200 font-mono text-xs font-bold">{b.dns}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black">Building Code</span>
                                                            <span className="text-zinc-200 font-mono text-xs font-bold">{b.code}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 border-l border-zinc-800 pl-8">
                                                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black">Auto-Detected Asset Binding</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500/40 border border-emerald-500" />
                                                                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-tight">Protocol Active</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-zinc-900/40 px-6 py-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-zinc-600" />
                        Click to expand protocol details
                    </p>
                    <p className="text-zinc-500 font-mono text-[10px] font-bold">CITIL_NETWORK_v1.0.4</p>
                </div>
            </div>
        </div>
    );
}
