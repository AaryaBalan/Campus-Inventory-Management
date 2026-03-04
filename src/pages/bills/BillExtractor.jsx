import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ReceiptText, UploadCloud, Loader2, CheckCircle, AlertCircle,
    Pencil, Save, Trash2, X, ChevronDown, ChevronUp, FileText, Image,
    Calendar, Store, Tag, DollarSign, Plus, Minus,
} from 'lucide-react';
import { billsApi } from '../../utils/api.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPTABLE = 'image/jpeg,image/png,image/webp,image/bmp,image/tiff,application/pdf';

function fmt(num) {
    if (num == null) return '—';
    return `₹${Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
}

// ── Editable field ────────────────────────────────────────────────────────────

function EditableField({ label, value, onChange, type = 'text', prefix }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{label}</label>
            <div className="relative flex items-center">
                {prefix && <span className="absolute left-3 text-zinc-500 text-sm">{prefix}</span>}
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={e => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
                    className={`w-full bg-zinc-900 border border-zinc-700/60 rounded-lg py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
                />
            </div>
        </div>
    );
}

// ── Item row editor ──────────────────────────────────────────────────────────

function ItemRow({ item, idx, onChange, onDelete }) {
    const update = (field, val) => onChange(idx, { ...item, [field]: val });
    return (
        <div className="grid grid-cols-12 gap-2 items-center group">
            <div className="col-span-5">
                <input
                    value={item.name || ''}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Item name"
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                />
            </div>
            <div className="col-span-2">
                <input
                    type="number"
                    value={item.quantity ?? ''}
                    onChange={e => update('quantity', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-right"
                />
            </div>
            <div className="col-span-2">
                <input
                    type="number"
                    value={item.unitPrice ?? ''}
                    onChange={e => update('unitPrice', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="Unit ₹"
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-right"
                />
            </div>
            <div className="col-span-2">
                <input
                    type="number"
                    value={item.totalAmount ?? ''}
                    onChange={e => update('totalAmount', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="Total ₹"
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all text-right"
                />
            </div>
            <div className="col-span-1 flex justify-center">
                <button
                    onClick={() => onDelete(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Remove row"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({ onFile, disabled }) {
    const [drag, setDrag] = useState(false);
    const inputRef = useRef();

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
    }, [onFile]);

    return (
        <div
            className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all
                ${drag ? 'border-zinc-400 bg-zinc-800/40' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-800/30'}
                ${disabled ? 'pointer-events-none opacity-40' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && inputRef.current?.click()}
        >
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <UploadCloud size={26} className={drag ? 'text-zinc-200' : 'text-zinc-400'} />
            </div>
            <div className="text-center">
                <p className="text-zinc-100 font-medium text-sm">Drop your bill here, or click to browse</p>
                <p className="text-zinc-500 text-xs mt-1">JPEG · PNG · WEBP · PDF — up to 20 MB</p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTABLE}
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
            />
        </div>
    );
}

// ── Bill editor / result card ─────────────────────────────────────────────────

function BillEditor({ bill, onSave, onDiscard }) {
    const [draft, setDraft] = useState({ ...bill });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const set = (field, value) => setDraft(d => ({ ...d, [field]: value }));
    const setItem = (idx, item) => setDraft(d => ({ ...d, items: d.items.map((it, i) => i === idx ? item : it) }));
    const removeItem = (idx) => setDraft(d => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));
    const addItem = () => setDraft(d => ({ ...d, items: [...(d.items || []), { name: '', quantity: null, unitPrice: null, totalAmount: null }] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(draft);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { /* parent handles it */ }
        finally { setSaving(false); }
    };

    return (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle size={17} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">Extraction Successful</p>
                        <p className="text-zinc-500 text-xs">{bill.fileName} · Review and correct fields below</p>
                    </div>
                </div>
                <button onClick={onDiscard} title="Discard" className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                    <X size={16} />
                </button>
            </div>

            {/* Meta fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <EditableField label="Vendor / Store" value={draft.vendor} onChange={v => set('vendor', v)} />
                <EditableField label="Date" value={draft.date} onChange={v => set('date', v)} type="date" />
                <EditableField label="Warranty Info" value={draft.warrantyInfo} onChange={v => set('warrantyInfo', v)} />
            </div>

            {/* Line items */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Line Items</p>
                    <button
                        onClick={addItem}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-all"
                    >
                        <Plus size={13} /> Add row
                    </button>
                </div>
                {/* Column header */}
                <div className="grid grid-cols-12 gap-2 px-0">
                    {['Name', 'Qty', 'Unit ₹', 'Total ₹', ''].map((h, i) => (
                        <p key={i} className={`text-[10px] text-zinc-600 uppercase tracking-widest font-semibold
                            ${i === 0 ? 'col-span-5' : i === 4 ? 'col-span-1' : 'col-span-2 text-right'}`}>{h}</p>
                    ))}
                </div>
                {draft.items?.length ? (
                    <div className="space-y-2">
                        {draft.items.map((item, idx) => (
                            <ItemRow key={idx} item={item} idx={idx} onChange={setItem} onDelete={removeItem} />
                        ))}
                    </div>
                ) : (
                    <p className="text-zinc-600 text-sm text-center py-4">No items extracted — add rows manually</p>
                )}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                <EditableField label="Tax" value={draft.tax} onChange={v => set('tax', v)} type="number" prefix="₹" />
                <EditableField label="Grand Total" value={draft.grandTotal} onChange={v => set('grandTotal', v)} type="number" prefix="₹" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl text-sm transition-all disabled:opacity-60"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} className="text-emerald-600" /> : <Save size={14} />}
                    {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Bill'}
                </button>
            </div>
        </div>
    );
}

// ── History item row ──────────────────────────────────────────────────────────

function HistoryRow({ bill, onDelete }) {
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this bill?')) return;
        setDeleting(true);
        try { await onDelete(bill.billId); } catch { setDeleting(false); }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl overflow-hidden">
            {/* Summary row */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-zinc-800/30 transition-all"
            >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <ReceiptText size={15} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-zinc-100 text-sm font-medium truncate">{bill.vendor || 'Unknown vendor'}</p>
                    <p className="text-zinc-500 text-xs">{fmtDate(bill.date)} · {bill.fileName || 'Uploaded file'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-zinc-200 text-sm font-semibold tabular-nums">{fmt(bill.grandTotal)}</span>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                    >
                        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                    {open ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                </div>
            </button>

            {/* Expanded detail */}
            {open && (
                <div className="border-t border-zinc-800/70 px-4 py-4 space-y-4">
                    {/* Summary grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                            { label: 'Tax', value: fmt(bill.tax) },
                            { label: 'Grand Total', value: fmt(bill.grandTotal) },
                            { label: 'Items', value: bill.items?.length ?? '—' },
                            { label: 'Warranty', value: bill.warrantyInfo || '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-zinc-800/50 rounded-lg px-3 py-2">
                                <p className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold mb-0.5">{label}</p>
                                <p className="text-zinc-100 font-medium truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Items table */}
                    {bill.items?.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                                        <th className="pb-2 text-left font-semibold pr-4">Item</th>
                                        <th className="pb-2 text-right font-semibold pr-4">Qty</th>
                                        <th className="pb-2 text-right font-semibold pr-4">Unit</th>
                                        <th className="pb-2 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {bill.items.map((item, i) => (
                                        <tr key={i} className="text-zinc-300">
                                            <td className="py-2 pr-4">{item.name || '—'}</td>
                                            <td className="py-2 pr-4 text-right tabular-nums">{item.quantity ?? '—'}</td>
                                            <td className="py-2 pr-4 text-right tabular-nums">{fmt(item.unitPrice)}</td>
                                            <td className="py-2 text-right tabular-nums">{fmt(item.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Processing state message ──────────────────────────────────────────────────

const STEPS = [
    { msg: 'Uploading file…', icon: UploadCloud },
    { msg: 'Extracting text with OCR…', icon: FileText },
    { msg: 'Parsing with AI…', icon: ReceiptText },
    { msg: 'Saving to your account…', icon: Save },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BillExtractor() {
    const [step, setStep] = useState(0); // 0=step 1=processing 2=result
    const [processingStep, setProcessingStep] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Load bill history on mount
    useEffect(() => {
        billsApi.list()
            .then(data => setHistory(data.bills || []))
            .catch(() => setHistory([]))
            .finally(() => setHistoryLoading(false));
    }, []);

    const handleFile = async (file) => {
        setError('');
        setStep(1);
        setProcessingStep(0);

        // Animate through processing steps
        const stepInterval = setInterval(() => {
            setProcessingStep(p => Math.min(p + 1, STEPS.length - 2));
        }, 1800);

        try {
            setProcessingStep(1);
            const bill = await billsApi.extract(file);
            clearInterval(stepInterval);
            setProcessingStep(STEPS.length - 1);
            await new Promise(r => setTimeout(r, 500)); // brief "Saving…" flash
            setResult(bill);
            setHistory(h => [bill, ...h]);
            setStep(2);
        } catch (err) {
            clearInterval(stepInterval);
            setError(err.message || 'Failed to process the file. Please try again.');
            setStep(0);
        }
    };

    const handleSave = async (draft) => {
        const updated = await billsApi.update(draft.billId, draft);
        setHistory(h => h.map(b => b.billId === draft.billId ? { ...b, ...updated } : b));
        setResult(prev => ({ ...prev, ...draft }));
    };

    const handleDelete = async (billId) => {
        await billsApi.delete(billId);
        setHistory(h => h.filter(b => b.billId !== billId));
        if (result?.billId === billId) { setResult(null); setStep(0); }
    };

    const handleDiscard = () => { setResult(null); setStep(0); };

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <ReceiptText size={19} className="text-zinc-200" />
                </div>
                <div>
                    <h1 className="text-white text-xl font-bold">Bill Extractor</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">Upload a receipt or invoice — AI extracts all the details automatically</p>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-medium">Extraction failed</p>
                        <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-red-400/50 hover:text-red-400">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* Upload / processing / result area */}
            {step === 0 && (
                <DropZone onFile={handleFile} disabled={false} />
            )}

            {step === 1 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-5">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-zinc-200 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {React.createElement(STEPS[processingStep]?.icon || Loader2, { size: 20, className: 'text-zinc-400' })}
                        </div>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-zinc-100 font-medium text-sm">{STEPS[processingStep]?.msg}</p>
                        <p className="text-zinc-600 text-xs">This may take 10–30 seconds for large files</p>
                    </div>
                    <div className="flex gap-2">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i <= processingStep ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && result && (
                <BillEditor bill={result} onSave={handleSave} onDiscard={handleDiscard} />
            )}

            {/* New extraction button when showing result */}
            {step === 2 && (
                <div className="flex justify-center">
                    <button
                        onClick={() => { setStep(0); setResult(null); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 text-sm transition-all"
                    >
                        <UploadCloud size={15} /> Extract another bill
                    </button>
                </div>
            )}

            {/* History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold text-sm">Previous Scans</h2>
                    <span className="text-xs text-zinc-500">{history.length} bills</span>
                </div>

                {historyLoading ? (
                    <div className="flex items-center justify-center py-10 text-zinc-600">
                        <Loader2 size={20} className="animate-spin mr-2" /> Loading history…
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                        <ReceiptText size={32} className="mx-auto mb-3 text-zinc-700" />
                        <p className="text-zinc-500 text-sm">No bills scanned yet</p>
                        <p className="text-zinc-700 text-xs mt-1">Upload your first bill above</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {history.map(bill => (
                            <HistoryRow key={bill.billId} bill={bill} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
