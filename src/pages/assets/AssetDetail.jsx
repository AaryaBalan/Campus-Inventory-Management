import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Calendar, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import AssetTimeline from '../../components/ui/AssetTimeline.jsx';
import { assets } from '../../data/mockData.js';

export default function AssetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const asset = assets.find(a => a.id === id) || assets[0];

    const healthColor = { Good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', Fair: 'text-amber-400 bg-amber-500/10 border-amber-500/30', Poor: 'text-red-400 bg-red-500/10 border-red-500/30' };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back + header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/assets')} className="p-2 rounded-lg hover:bg-zinc-900 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-white text-xl font-bold">{asset.name}</h1>
                        <StatusIndicator status={asset.status} />
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 font-mono">{asset.id} · {asset.qr}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Asset info + QR */}
                <div className="space-y-4">
                    {/* QR Code */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 text-center">
                        <p className="text-slate-400 text-xs font-medium mb-3">QR CODE</p>
                        <div className="w-28 h-28 mx-auto bg-white rounded-xl p-2 mb-3">
                            <div className="grid grid-cols-7 gap-px h-full">
                                {[...Array(49)].map((_, i) => (
                                    <div key={i} className={`${(i + asset.id.charCodeAt(i % asset.id.length)) % 2 === 0 ? 'bg-[#0e0e11]' : 'bg-white'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-300 text-xs font-mono">{asset.qr}</p>
                        <button className="mt-2 text-zinc-300 text-xs hover:text-zinc-200 transition-colors">Download QR</button>
                    </div>

                    {/* Health indicator */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <p className="text-slate-400 text-xs font-medium mb-3">ASSET HEALTH</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${healthColor[asset.health]}`}>
                            {asset.health === 'Good' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            {asset.health} Condition
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <p className="text-slate-400 text-xs font-medium mb-3">ACTIONS</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Transfer Asset', color: 'bg-zinc-700 hover:bg-zinc-600' },
                                { label: 'Mark for Maintenance', color: 'bg-amber-600 hover:bg-amber-500' },
                                { label: 'Verify Asset', color: 'bg-emerald-600 hover:bg-emerald-500' },
                                { label: 'Retire Asset', color: 'bg-red-600/80 hover:bg-red-600' },
                            ].map(btn => (
                                <button key={btn.label} className={`w-full py-2 rounded-xl text-white text-sm font-medium ${btn.color} transition-colors`}>{btn.label}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Details card */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <h3 className="text-white font-semibold text-sm mb-4">Asset Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Category', value: asset.category, icon: <AlertTriangle size={14} /> },
                                { label: 'Location', value: asset.location, icon: <MapPin size={14} /> },
                                { label: 'Department', value: asset.department, icon: <User size={14} /> },
                                { label: 'Assigned To', value: asset.assignedTo, icon: <User size={14} /> },
                                { label: 'Purchase Date', value: asset.purchaseDate, icon: <Calendar size={14} /> },
                                { label: 'Purchase Value', value: `₹${asset.purchaseValue.toLocaleString()}`, icon: <DollarSign size={14} /> },
                            ].map(({ label, value, icon }) => (
                                <div key={label} className="bg-[#0e0e11]/40 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                        <span className="text-slate-500">{icon}</span>
                                        <span className="text-xs">{label}</span>
                                    </div>
                                    <p className="text-slate-200 text-sm font-medium">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CITRA Lifecycle Timeline */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <h3 className="text-white font-semibold text-sm mb-4">Lifecycle Timeline</h3>
                        <AssetTimeline assetId={id || asset.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
