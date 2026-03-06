import React, { useState, useEffect } from 'react';
import {
    Monitor, Wifi, WifiOff, AlertTriangle, Copy, CheckCheck,
    ChevronDown, ChevronUp, Search, Filter, RefreshCw,
    Cpu, HardDrive, Globe, Calendar, Clock, MapPin, Hash
} from 'lucide-react';
import { registeredSystems, buildingIPMappings } from '../../data/mockData.js';

// ── helpers ──────────────────────────────────────────────────────────────────
function useLiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n) { return String(n).padStart(2, '0'); }

function formatClock(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function formatDate(d) {
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Building colors synced with campus map
const BUILDING_COLORS = {
    ADM: '#1e3a8a', LIB: '#0891b2', LHA: '#059669',
    SCI: '#7c3aed', SRV: '#d97706', CNF: '#0891b2',
    STF: '#dc2626', SEM: '#059669',
};

function CopyBtn({ text }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="ml-1 p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/60 transition-all"
        >
            {copied ? <CheckCheck size={10} className="text-emerald-400" /> : <Copy size={10} />}
        </button>
    );
}

function StatusBadge({ status }) {
    const cfg = {
        online: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400 animate-pulse', label: 'Online' },
        offline: { color: 'text-zinc-500', bg: 'bg-zinc-800/60 border-zinc-700/50', dot: 'bg-zinc-500', label: 'Offline' },
        warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-400 animate-pulse', label: 'Warning' },
    }[status] || {};
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-widest ${cfg.bg} ${cfg.color} whitespace-nowrap shrink-0 transition-all`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function MonoCell({ value, color = 'text-cyan-300', bg = 'bg-cyan-500/10 border-cyan-500/20' }) {
    return (
        <span className={`inline-flex items-center font-mono text-xs ${color} ${bg} border px-2.5 py-1 rounded-lg leading-none whitespace-nowrap`}>
            {value}<CopyBtn text={value} />
        </span>
    );
}

function SortIcon({ active, dir }) {
    if (!active) return <ChevronDown size={11} className="text-zinc-600 ml-1" />;
    return dir === 'asc'
        ? <ChevronUp size={11} className="text-zinc-200 ml-1" />
        : <ChevronDown size={11} className="text-zinc-200 ml-1" />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewSystems() {
    const now = useLiveClock();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [expanded, setExpanded] = useState(null);
    const [refreshAnim, setRefreshAnim] = useState(false);

    const handleSort = col => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const filtered = registeredSystems
        .filter(s => statusFilter === 'All' || s.status === statusFilter.toLowerCase())
        .filter(s => {
            const q = search.toLowerCase();
            return !q || s.hostname.toLowerCase().includes(q) || s.ip.includes(q) ||
                s.mac.toLowerCase().includes(q) || s.building.toLowerCase().includes(q) ||
                s.asset_id.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            const av = a[sortBy], bv = b[sortBy];
            const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });

    const online = registeredSystems.filter(s => s.status === 'online').length;
    const offline = registeredSystems.filter(s => s.status === 'offline').length;
    const warning = registeredSystems.filter(s => s.status === 'warning').length;

    const Th = ({ col, label }) => (
        <th onClick={() => handleSort(col)}
            className="px-5 py-4 text-left text-zinc-400 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-zinc-200 select-none whitespace-nowrap border-b border-zinc-800/80">
            <span className="flex items-center">{label}<SortIcon active={sortBy === col} dir={sortDir} /></span>
        </th>
    );

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Dashboard</span>
                        <span className="text-zinc-600 text-xs">›</span>
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-widest">New Systems</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">Endpoint Registry</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Agent-discovered systems · Auto-registered via network IP detection
                    </p>
                </div>

                {/* Live clock */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl px-5 py-3 flex flex-col items-end gap-0.5 self-start shrink-0">
                    <span className="text-white text-xl font-mono font-bold tracking-widest tabular-nums">
                        {formatClock(now)}
                    </span>
                    <span className="text-zinc-400 text-xs">{formatDate(now)}</span>
                    <span className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-emerald-400 text-[10px] font-medium">Live</span>
                    </span>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Endpoints', value: registeredSystems.length, icon: <Monitor size={18} />, color: 'border-zinc-700/60', ib: 'bg-zinc-800/60', ic: 'text-zinc-300' },
                    { label: 'Online', value: online, icon: <Wifi size={18} />, color: 'border-emerald-500/20', ib: 'bg-emerald-500/10', ic: 'text-emerald-400' },
                    { label: 'Offline', value: offline, icon: <WifiOff size={18} />, color: 'border-zinc-700/60', ib: 'bg-zinc-800/60', ic: 'text-zinc-400' },
                    { label: 'Warning', value: warning, icon: <AlertTriangle size={18} />, color: 'border-amber-500/20', ib: 'bg-amber-500/10', ic: 'text-amber-400' },
                ].map(k => (
                    <div key={k.label} className={`bg-zinc-900/70 border ${k.color} rounded-2xl p-5 hover:bg-zinc-900 transition-all duration-200`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{k.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${k.ib}`}><span className={k.ic}>{k.icon}</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters + Search ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search hostname, IP, MAC, building…"
                        className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={13} className="text-zinc-500 shrink-0" />
                    {['All', 'Online', 'Offline', 'Warning'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${statusFilter === s
                                ? 'bg-zinc-700 text-white border-zinc-500'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'}`}
                        >{s}</button>
                    ))}
                    <button
                        onClick={() => { setRefreshAnim(true); setTimeout(() => setRefreshAnim(false), 700); }}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={13} className={refreshAnim ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Main Table ── */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800/80 rounded-xl"><Monitor size={15} className="text-zinc-300" /></div>
                        <div>
                            <h2 className="text-zinc-100 font-semibold text-sm">Registered Endpoints</h2>
                            <p className="text-zinc-500 text-xs mt-0.5">Agent-reported · hostname · IP · MAC · hardware specs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs">{filtered.length} of {registeredSystems.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead className="bg-zinc-800/40 border-b border-zinc-800/80">
                            <tr>
                                <Th col="id" label="System ID" />
                                <Th col="hostname" label="Hostname" />
                                <Th col="ip" label="IP Address" />
                                <Th col="mac" label="MAC" />
                                <Th col="building" label="Location" />
                                <Th col="cpu" label="CPU" />
                                <Th col="ram" label="RAM" />
                                <Th col="status" label="Status" />
                                <Th col="last_seen" label="Last Seen" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-10 text-center text-zinc-600 text-sm">No systems match your filter.</td></tr>
                            ) : filtered.map(s => {
                                const bColor = BUILDING_COLORS[s.building_code] || '#52525b';
                                const isOpen = expanded === s.id;
                                return (
                                    <React.Fragment key={s.id}>
                                        <tr
                                            onClick={() => setExpanded(isOpen ? null : s.id)}
                                            className={`cursor-pointer transition-colors ${isOpen ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/25'}`}
                                        >
                                            {/* System ID */}
                                            <td className="px-5 py-4.5">
                                                <span className="text-zinc-500 text-xs font-mono font-bold whitespace-nowrap">{s.id}</span>
                                            </td>
                                            {/* Hostname */}
                                            <td className="px-5 py-4.5">
                                                <div className="flex items-center gap-3 whitespace-nowrap">
                                                    <div className="w-7 h-7 bg-zinc-800/80 border border-zinc-700/50 rounded-lg flex items-center justify-center shrink-0">
                                                        <Monitor size={13} className="text-zinc-300" />
                                                    </div>
                                                    <span className="text-zinc-100 text-sm font-bold tracking-tight">{s.hostname}</span>
                                                </div>
                                            </td>
                                            {/* IP */}
                                            <td className="px-5 py-4.5">
                                                <MonoCell value={s.ip} />
                                            </td>
                                            {/* MAC */}
                                            <td className="px-5 py-4.5">
                                                <MonoCell value={s.mac} color="text-zinc-300" bg="bg-zinc-800/60 border-zinc-700/50" />
                                            </td>
                                            {/* Location */}
                                            <td className="px-5 py-4.5">
                                                <div className="flex items-center gap-2.5 whitespace-nowrap">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10" style={{ background: bColor }} />
                                                    <span className="text-zinc-300 text-sm font-bold tracking-tight">{s.building}</span>
                                                </div>
                                            </td>
                                            {/* CPU */}
                                            <td className="px-5 py-4.5">
                                                <span className="text-zinc-400 text-xs font-medium truncate max-w-[160px] block whitespace-nowrap">{s.cpu}</span>
                                            </td>
                                            {/* RAM */}
                                            <td className="px-5 py-4.5">
                                                <span className="text-zinc-300 text-xs font-bold font-mono bg-zinc-800/60 border border-zinc-700/40 px-3 py-1 rounded-lg whitespace-nowrap">{s.ram}</span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-5 py-4.5">
                                                <StatusBadge status={s.status} />
                                            </td>
                                            {/* Last Seen */}
                                            <td className="px-5 py-4.5">
                                                <div className="flex flex-col gap-0 leading-tight whitespace-nowrap">
                                                    <span className="text-zinc-400 text-xs font-bold font-mono">{s.last_seen.split(' ')[1]}</span>
                                                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-tighter opacity-70">{s.last_seen.split(' ')[0]}</span>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded detail panel */}
                                        {isOpen && (
                                            <tr className="bg-zinc-800/20">
                                                <td colSpan={9} className="px-6 py-5">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                                                        {[
                                                            { icon: <Hash size={11} />, label: 'Asset ID', value: s.asset_id },
                                                            { icon: <Monitor size={11} />, label: 'Hostname', value: s.hostname },
                                                            { icon: <Globe size={11} />, label: 'IP Address', value: s.ip },
                                                            { icon: <Wifi size={11} />, label: 'MAC Address', value: s.mac },
                                                            { icon: <Cpu size={11} />, label: 'Processor', value: s.cpu },
                                                            { icon: <HardDrive size={11} />, label: 'RAM', value: s.ram },
                                                            { icon: <Monitor size={11} />, label: 'OS', value: s.os },
                                                            { icon: <MapPin size={11} />, label: 'Location', value: s.building },
                                                            { icon: <Clock size={11} />, label: 'Uptime', value: s.uptime },
                                                            { icon: <Calendar size={11} />, label: 'First Registered', value: s.registered_at },
                                                            { icon: <Clock size={11} />, label: 'Last Seen', value: s.last_seen },
                                                            { icon: <Hash size={11} />, label: 'Building Code', value: s.building_code },
                                                        ].map(d => (
                                                            <div key={d.label} className="flex flex-col gap-1">
                                                                <span className="flex items-center gap-1 text-zinc-500 uppercase tracking-wider text-[9px] font-semibold">
                                                                    <span className="text-zinc-600">{d.icon}</span>{d.label}
                                                                </span>
                                                                <span className="text-zinc-200 font-mono text-[11px] break-all">{d.value}</span>
                                                            </div>
                                                        ))}
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

                <div className="px-5 py-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <p className="text-zinc-600 text-xs">Select any row to expand full system details</p>
                    <p className="text-zinc-600 text-xs font-mono">Updated: {formatClock(now)}</p>
                </div>
            </div>

        </div>
    );
}
