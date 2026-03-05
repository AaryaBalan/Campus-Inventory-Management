import React, { useState } from 'react';
import { Network, Server, Shield, Wifi, Copy, CheckCheck, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { buildingIPMappings, buildings } from '../../data/mockData.js';

// Building color map from campus map data
const buildingColorMap = Object.fromEntries(buildings.map(b => [b.id, b.color]));

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handle = () => {
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <button
            onClick={handle}
            title="Copy"
            className="ml-1.5 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all"
        >
            {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
    );
}

function StatusDot({ status }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            <span className={`text-xs font-medium ${status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {status === 'active' ? 'Active' : 'Inactive'}
            </span>
        </span>
    );
}

function IPCell({ ip }) {
    return (
        <span className="flex items-center font-mono text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
            {ip}
            <CopyButton text={ip} />
        </span>
    );
}

function SortIcon({ col, sortBy, sortDir }) {
    if (sortBy !== col) return <ChevronDown size={12} className="text-zinc-600 ml-1" />;
    return sortDir === 'asc'
        ? <ChevronUp size={12} className="text-zinc-300 ml-1" />
        : <ChevronDown size={12} className="text-zinc-300 ml-1" />;
}

export default function BuildingIPMapping() {
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [expandedRow, setExpandedRow] = useState(null);

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const sorted = [...buildingIPMappings].sort((a, b) => {
        const av = a[sortBy], bv = b[sortBy];
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const ThCell = ({ col, label }) => (
        <th
            onClick={() => handleSort(col)}
            className="px-4 py-3 text-left text-zinc-400 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-zinc-200 select-none whitespace-nowrap"
        >
            <span className="flex items-center">
                {label}
                <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
            </span>
        </th>
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Dashboard</span>
                        <span className="text-zinc-600 text-xs">›</span>
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Network</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">IP Protocol Mapping</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        One-time setup · Network → Building binding for automatic asset location detection.
                    </p>
                </div>
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full self-start sm:self-center whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    {buildingIPMappings.filter(b => b.status === 'active').length} Subnets Active
                </span>
            </div>

            {/* Phase banner */}
            <div className="flex items-start gap-3 bg-zinc-900/70 border border-zinc-700/50 rounded-2xl p-4">
                <div className="p-2 bg-zinc-800/80 rounded-xl shrink-0">
                    <Info size={15} className="text-zinc-300" />
                </div>
                <div>
                    <p className="text-zinc-200 text-sm font-semibold">PHASE 1 — One-Time Setup</p>
                    <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                        Each campus building is assigned a dedicated <span className="text-zinc-200 font-medium">/24 IP subnet</span>. When a tracked asset's
                        IP address falls within a building's range, the system automatically detects and updates its location —
                        eliminating the need for manual entry on the <span className="text-zinc-200 font-medium">Assets</span> page.
                    </p>
                </div>
            </div>

            {/* Summary KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Buildings Mapped', value: buildingIPMappings.length, icon: <Network size={18} />, color: 'border-zinc-700/60', iconBg: 'bg-zinc-800/60', iconColor: 'text-zinc-300' },
                    { label: 'Active Subnets', value: buildingIPMappings.filter(b => b.status === 'active').length, icon: <Wifi size={18} />, color: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
                    { label: 'IP Space / Subnet', value: '254 hosts', icon: <Server size={18} />, color: 'border-zinc-700/60', iconBg: 'bg-zinc-800/60', iconColor: 'text-zinc-300' },
                    { label: 'Protocol', value: 'IPv4 / VLAN', icon: <Shield size={18} />, color: 'border-zinc-700/60', iconBg: 'bg-zinc-800/60', iconColor: 'text-zinc-300' },
                ].map(kpi => (
                    <div key={kpi.label} className={`bg-zinc-900/70 border ${kpi.color} rounded-2xl p-5 hover:bg-zinc-900 transition-all duration-200`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${kpi.iconBg}`}>
                                <span className={kpi.iconColor}>{kpi.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main table card */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800/80 rounded-xl">
                            <Network size={15} className="text-zinc-300" />
                        </div>
                        <div>
                            <h2 className="text-zinc-100 font-semibold text-sm">Building IP Address Table</h2>
                            <p className="text-zinc-500 text-xs mt-0.5">buildings · network subnet · VLAN configuration</p>
                        </div>
                    </div>
                    <span className="text-zinc-500 text-xs">{buildingIPMappings.length} entries</span>
                </div>

                {/* Scrollable table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                        <thead className="bg-zinc-800/40 border-b border-zinc-800/80">
                            <tr>
                                <ThCell col="id" label="ID" />
                                <ThCell col="building_name" label="Building Name" />
                                <ThCell col="code" label="Code" />
                                <ThCell col="vlan" label="VLAN" />
                                <ThCell col="ip_range_start" label="IP Range Start" />
                                <ThCell col="ip_range_end" label="IP Range End" />
                                <ThCell col="subnet" label="Subnet" />
                                <ThCell col="gateway" label="Gateway" />
                                <ThCell col="status" label="Status" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {sorted.map((b) => {
                                const bColor = buildingColorMap[b.building_id] || '#52525b';
                                const isExpanded = expandedRow === b.id;
                                return (
                                    <React.Fragment key={b.id}>
                                        <tr
                                            onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                                            className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                                        >
                                            {/* ID */}
                                            <td className="px-4 py-3">
                                                <span className="text-zinc-500 text-xs font-mono">{String(b.id).padStart(2, '0')}</span>
                                            </td>
                                            {/* Building name with color dot */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ background: bColor }}
                                                    />
                                                    <span className="text-zinc-100 text-sm font-medium">{b.building_name}</span>
                                                </div>
                                            </td>
                                            {/* Code badge */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className="px-2 py-0.5 rounded-md text-xs font-bold font-mono border"
                                                    style={{ color: bColor, borderColor: bColor + '40', background: bColor + '18' }}
                                                >
                                                    {b.code}
                                                </span>
                                            </td>
                                            {/* VLAN */}
                                            <td className="px-4 py-3">
                                                <span className="text-zinc-300 text-xs font-mono bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 rounded">
                                                    VLAN {b.vlan}
                                                </span>
                                            </td>
                                            {/* IP Start */}
                                            <td className="px-4 py-3">
                                                <IPCell ip={b.ip_range_start} />
                                            </td>
                                            {/* IP End */}
                                            <td className="px-4 py-3">
                                                <IPCell ip={b.ip_range_end} />
                                            </td>
                                            {/* Subnet */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-zinc-300">{b.subnet}</span>
                                            </td>
                                            {/* Gateway */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-zinc-400">{b.gateway}</span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <StatusDot status={b.status} />
                                            </td>
                                        </tr>

                                        {/* Expanded detail row */}
                                        {isExpanded && (
                                            <tr className="bg-zinc-800/20">
                                                <td colSpan={9} className="px-6 py-4">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                        {[
                                                            { label: 'DNS Server', value: b.dns },
                                                            { label: 'Gateway', value: b.gateway },
                                                            { label: 'Floor', value: `Floor ${b.floor}` },
                                                            { label: 'Campus Map ID', value: b.building_id },
                                                        ].map(det => (
                                                            <div key={det.label} className="flex flex-col gap-1">
                                                                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">{det.label}</span>
                                                                <span className="text-zinc-200 font-mono">{det.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-zinc-600 text-[10px] mt-3">
                                                        Click row again to collapse · All IPs in range <span className="text-cyan-400 font-mono">{b.ip_range_start}</span> – <span className="text-cyan-400 font-mono">{b.ip_range_end}</span> are auto-mapped to <span className="text-zinc-400 font-medium">{b.building_name}</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Table footer */}
                <div className="px-5 py-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <p className="text-zinc-600 text-xs">Click any row to expand subnet details</p>
                    <p className="text-zinc-600 text-xs font-mono">
                        IP space: 192.168.10.0 – 192.168.80.254
                    </p>
                </div>
            </div>

            {/* How it works note */}
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5">
                <h3 className="text-zinc-200 font-semibold text-sm mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-zinc-400" />
                    How Automatic Location Detection Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-zinc-300 font-semibold">Step 1 · IP Detection</span>
                        <span>When an asset connects to the network, its current IP address is captured automatically via DHCP lease or network scan.</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-zinc-300 font-semibold">Step 2 · Range Lookup</span>
                        <span>The IP is compared against the ranges in this table. If it falls within a building's subnet (e.g. 192.168.40.x → Science Lab), the building is identified.</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-zinc-300 font-semibold">Step 3 · Auto-Update Location</span>
                        <span>The asset's <em>Location</em> field is updated automatically on the Assets page. No manual entry needed. Campus Map reflects the change instantly.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
