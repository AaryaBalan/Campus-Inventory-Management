import React, { useState } from 'react';
import { QrCode, Camera, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { assets } from '../../data/mockData.js';
import StatusIndicator from '../../components/ui/StatusIndicator.jsx';

const MOCK_SCANS = ['AST-0001', 'AST-0004', 'AST-0007', 'INVALID-999', 'AST-0002'];
let scanIdx = 0;

export default function QRScanner() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualId, setManualId] = useState('');

    const lookupAsset = (id) => {
        const asset = assets.find(a => a.id === id || a.qr === id);
        return asset ? { success: true, asset } : { success: false, id };
    };

    const handleScan = () => {
        setScanning(true);
        setResult(null);
        setTimeout(() => {
            const mockId = MOCK_SCANS[scanIdx % MOCK_SCANS.length];
            scanIdx++;
            const found = lookupAsset(mockId);
            setResult({ ...found, scannedAt: new Date().toLocaleTimeString() });
            setScanHistory(h => [{ ...found, id: mockId, scannedAt: new Date().toLocaleTimeString() }, ...h].slice(0, 5));
            setScanning(false);
        }, 1800);
    };

    const handleManual = (e) => {
        e.preventDefault();
        if (!manualId.trim()) return;
        const found = lookupAsset(manualId.trim());
        setResult({ ...found, scannedAt: new Date().toLocaleTimeString() });
        setScanHistory(h => [{ ...found, id: manualId, scannedAt: new Date().toLocaleTimeString() }, ...h].slice(0, 5));
        setManualId('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-white text-xl font-bold">QR Scanner</h1>
                <p className="text-slate-400 text-sm mt-0.5">Scan asset QR codes to view details and log movements</p>
            </div>

            {/* Scanner viewport */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="relative bg-[#0e0e11] flex items-center justify-center" style={{ height: 260 }}>
                    {/* Animated scanner corners */}
                    <div className={`relative w-52 h-52 ${scanning ? 'opacity-100' : 'opacity-60'}`}>
                        {/* Corner brackets */}
                        {[
                            'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                            'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                            'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                            'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
                        ].map((cls, i) => (
                            <span key={i} className={`absolute w-10 h-10 ${cls} ${scanning ? 'border-blue-400' : 'border-slate-500'} transition-colors`} />
                        ))}
                        {/* Scanning line */}
                        {scanning && (
                            <div className="absolute inset-x-0 h-0.5 bg-blue-400 shadow-[0_0_12px_3px_rgba(96,165,250,0.6)] animate-scan-line" />
                        )}
                        {/* Center icon */}
                        {!scanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <QrCode size={60} className="text-slate-600" />
                            </div>
                        )}
                    </div>
                    {scanning && (
                        <div className="absolute bottom-4 text-zinc-300 text-sm animate-pulse font-medium">Scanning...</div>
                    )}
                </div>

                <div className="p-5 space-y-3">
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Camera size={17} /> {scanning ? 'Scanning...' : 'Simulate Camera Scan'}
                    </button>
                    <p className="text-center text-slate-500 text-xs">or enter ID manually</p>
                    <form onSubmit={handleManual} className="flex gap-2">
                        <input
                            value={manualId}
                            onChange={e => setManualId(e.target.value)}
                            placeholder="e.g. AST-0001 or QR-AST-001"
                            className="flex-1 bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-zinc-500/60"
                        />
                        <button type="submit" className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors">
                            <ArrowRight size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Result card */}
            {result && (
                <div className={`border rounded-2xl p-5 transition-all ${result.success ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                    {result.success ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle size={20} className="text-emerald-400" />
                                <p className="text-emerald-400 font-semibold text-sm">Asset Found!</p>
                                <span className="text-slate-500 text-xs ml-auto">{result.scannedAt}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ['Asset ID', result.asset.id],
                                    ['Name', result.asset.name],
                                    ['Category', result.asset.category],
                                    ['Location', result.asset.location],
                                    ['Assigned To', result.asset.assignedTo],
                                    ['Status', null],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p className="text-slate-400 text-xs">{label}</p>
                                        {val ? <p className="text-slate-200 text-sm font-medium">{val}</p> : <StatusIndicator status={result.asset.status} />}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors">Log Movement</button>
                                <button className="flex-1 py-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-sm transition-all">View Details</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-red-400" />
                            <div>
                                <p className="text-red-400 font-semibold text-sm">Asset Not Found</p>
                                <p className="text-slate-400 text-xs mt-0.5">No asset matches "<span className="font-mono text-slate-300">{result.id}</span>"</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Scan history */}
            {scanHistory.length > 0 && (
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-3">Recent Scans</h3>
                    <div className="space-y-2">
                        {scanHistory.map((h, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ${h.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    <div>
                                        <p className="text-slate-200 text-sm">{h.success ? h.asset.name : `Unknown (${h.id})`}</p>
                                        <p className="text-slate-500 text-xs">{h.success ? h.asset.id : 'Not found'}</p>
                                    </div>
                                </div>
                                <span className="text-slate-500 text-xs">{h.scannedAt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 1.2s ease-in-out infinite alternate;
        }
      `}</style>
        </div>
    );
}
