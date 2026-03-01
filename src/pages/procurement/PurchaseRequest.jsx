import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { procurementApi } from '../../utils/api.js';
import { useApp } from '../../context/AppContext.jsx';

const STEPS = ['Department', 'Item Selection', 'Qty & Justification', 'Priority & Submit'];
const DEPARTMENTS = ['Administration', 'Finance', 'IT', 'Science', 'Library', 'Security', 'Computer Science', 'Electronics'];
const ITEMS = [
    'Dell Laptop Pro 15', 'HP LaserJet Printer', 'Office Chair Ergonomic',
    'A4 Paper (500 reams)', 'Lab Microscope', 'Network Switch 48-Port',
    'Air Conditioner 1.5T', 'Projector Epson', 'UPS APC 2200VA', 'Whiteboard Marker Set',
];

export default function PurchaseRequest() {
    const navigate = useNavigate();
    const { currentUser } = useApp();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        dept: currentUser?.department || '',
        item: '',
        qty: 1,
        unitCost: '',
        justification: '',
        priority: 'Medium',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
    const total = (parseInt(form.qty) || 0) * (parseFloat(form.unitCost) || 0);

    const canNext = () => {
        if (step === 0) return !!form.dept;
        if (step === 1) return !!form.item;
        if (step === 2) return form.qty > 0 && form.unitCost > 0 && form.justification.trim().length > 10;
        return true;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            await procurementApi.create({
                items: [{
                    itemName: form.item,
                    itemDescription: form.item,
                    quantity: parseInt(form.qty),
                    estimatedUnitCost: parseFloat(form.unitCost),
                    justification: form.justification.trim(),
                    category: 'General',
                }],
                priority: form.priority,
                notes: `Department: ${form.dept}`,
                requiredByDate: null,
            });
            navigate('/procurement/approvals', { state: { successMsg: 'Purchase request submitted successfully!' } });
        } catch (err) {
            setError(err.message || 'Failed to submit request. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-white text-xl font-bold">New Purchase Request</h1>
                <p className="text-slate-400 text-sm mt-0.5">Submit a procurement request for approval</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center">
                {STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    i === step ? 'bg-zinc-700 border-zinc-500 text-white' :
                                        'bg-zinc-900 border-slate-600 text-slate-400'}`}>
                                {i < step ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <span className={`text-[10px] hidden sm:block whitespace-nowrap ${i === step ? 'text-zinc-300' : i < step ? 'text-emerald-400' : 'text-slate-500'}`}>{s}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                </div>
            )}

            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                {step === 0 && (
                    <>
                        <h3 className="text-white font-semibold">Select Department</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {DEPARTMENTS.map(d => (
                                <button key={d} onClick={() => update('dept', d)}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.dept === d ? 'bg-zinc-600/20 border-zinc-500 text-zinc-300' : 'bg-[#0e0e11]/40 border-zinc-800 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </>
                )}
                {step === 1 && (
                    <>
                        <h3 className="text-white font-semibold">Select Item</h3>
                        <div className="space-y-2">
                            {ITEMS.map(item => (
                                <button key={item} onClick={() => update('item', item)}
                                    className={`w-full p-3 rounded-xl border text-left text-sm transition-all ${form.item === item ? 'bg-zinc-600/20 border-zinc-500 text-zinc-300' : 'bg-[#0e0e11]/40 border-zinc-800 text-slate-300 hover:border-slate-500'}`}>
                                    {item}
                                </button>
                            ))}
                            <input
                                type="text"
                                placeholder="Or type a custom item name..."
                                value={ITEMS.includes(form.item) ? '' : form.item}
                                onChange={e => update('item', e.target.value)}
                                className="w-full p-3 rounded-xl border border-zinc-700 bg-[#0e0e11]/60 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-zinc-500"
                            />
                        </div>
                    </>
                )}
                {step === 2 && (
                    <>
                        <h3 className="text-white font-semibold">Quantity & Justification</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Quantity</label>
                                <input type="number" min="1" value={form.qty} onChange={e => update('qty', e.target.value)}
                                    className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/60" />
                            </div>
                            <div>
                                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Unit Cost (₹)</label>
                                <input type="number" value={form.unitCost} onChange={e => update('unitCost', e.target.value)} placeholder="Enter unit cost"
                                    className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/60 placeholder-slate-500" />
                            </div>
                        </div>
                        {total > 0 && (
                            <div className="bg-zinc-600/10 border border-zinc-500/20 rounded-xl p-3 text-sm text-zinc-300 font-medium">
                                Total Estimated Cost: ₹{total.toLocaleString('en-IN')}
                            </div>
                        )}
                        <div>
                            <label className="text-slate-300 text-xs font-medium mb-1.5 block">Justification <span className="text-slate-500">(min 10 characters)</span></label>
                            <textarea value={form.justification} onChange={e => update('justification', e.target.value)}
                                placeholder="Describe the reason for this purchase request..." rows={4}
                                className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-zinc-500/60 resize-none" />
                        </div>
                    </>
                )}
                {step === 3 && (
                    <>
                        <h3 className="text-white font-semibold">Priority & Review</h3>
                        <div className="flex gap-3 mb-4">
                            {['Low', 'Medium', 'High'].map(p => (
                                <button key={p} onClick={() => update('priority', p)}
                                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.priority === p ?
                                        (p === 'High' ? 'bg-red-500/20 border-red-500 text-red-400' :
                                            p === 'Medium' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                                                'bg-emerald-500/20 border-emerald-500 text-emerald-400')
                                        : 'bg-[#0e0e11]/40 border-zinc-800 text-slate-400 hover:border-slate-500'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="bg-[#0e0e11]/40 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                            <h4 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Request Summary</h4>
                            {[
                                ['Department', form.dept],
                                ['Item', form.item],
                                ['Quantity', form.qty],
                                ['Unit Cost', `₹${parseFloat(form.unitCost || 0).toLocaleString('en-IN')}`],
                                ['Total', `₹${total.toLocaleString('en-IN')}`],
                                ['Priority', form.priority],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between text-sm">
                                    <span className="text-slate-400">{k}</span>
                                    <span className={`text-slate-200 font-medium ${k === 'Total' ? 'text-zinc-300 font-bold' : ''}`}>{v || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-between">
                <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/procurement/approvals')}
                    className="px-5 py-2.5 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all">
                    {step === 0 ? 'Cancel' : 'Back'}
                </button>
                <button
                    onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
                    disabled={!canNext() || submitting}
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    {submitting ? (
                        <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                    ) : step === STEPS.length - 1 ? (
                        'Submit Request'
                    ) : (
                        <> Continue <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
