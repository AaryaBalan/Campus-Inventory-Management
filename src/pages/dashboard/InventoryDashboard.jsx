import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, QrCode, Package, ArrowRight, RefreshCw } from 'lucide-react';
import { KPICard } from '../../components/ui/Card.jsx';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';
import { kpis, inventoryItems } from '../../data/mockData.js';

export default function InventoryDashboard() {
    const navigate = useNavigate();
    const critical = inventoryItems.filter(i => i.status === 'critical');
    const low = inventoryItems.filter(i => i.status === 'low');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Inventory Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time stock monitoring & alerts</p>
                </div>
                <button
                    onClick={() => navigate('/scanner')}
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                    <QrCode size={16} /> QR Scanner
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Items" value={inventoryItems.length} subtitle="Tracked items" icon={<Package size={20} />} color="blue" />
                <KPICard title="Critical Stock" value={critical.length} subtitle="Immediate reorder" icon={<AlertTriangle size={20} />} color="red" />
                <KPICard title="Low Stock" value={low.length} subtitle="Reorder soon" icon={<AlertTriangle size={20} />} color="amber" />
                <KPICard title="Auto-Reorder Active" value="3" subtitle="Items tracked" icon={<RefreshCw size={20} />} color="green" />
            </div>

            {/* Critical alerts */}
            {critical.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-red-400" />
                        <h3 className="text-red-400 font-semibold text-sm">Critical Stock Alert</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {critical.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-zinc-900/70 border border-red-500/20 rounded-xl p-3">
                                <div>
                                    <p className="text-slate-200 text-sm font-medium">{item.name}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{item.quantity} {item.unit} remaining (reorder at {item.reorderLevel})</p>
                                </div>
                                <button className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                                    Reorder
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock levels table */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">All Inventory Items</h3>
                    <button onClick={() => navigate('/inventory')} className="text-zinc-300 text-xs hover:text-zinc-200 flex items-center gap-1">Full View <ArrowRight size={12} /></button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                {['Item', 'Category', 'Stock', 'Reorder Level', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left text-slate-400 text-xs font-medium pb-3 pr-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/40">
                            {inventoryItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="py-3 pr-4">
                                        <p className="text-slate-200 text-xs font-medium">{item.name}</p>
                                        <p className="text-slate-500 text-xs">{item.id}</p>
                                    </td>
                                    <td className="py-3 pr-4 text-slate-400 text-xs">{item.category}</td>
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${item.status === 'ok' ? 'bg-emerald-500' : item.status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min((item.quantity / item.maxLevel) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-slate-200 text-xs font-medium">{item.quantity} {item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4 text-slate-400 text-xs">{item.reorderLevel}</td>
                                    <td className="py-3 pr-4"><StatusIndicator status={item.status} /></td>
                                    <td className="py-3">
                                        <button className="text-xs text-zinc-300 hover:text-zinc-200 transition-colors">Update</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
