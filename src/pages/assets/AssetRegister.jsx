import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle } from 'lucide-react';

const STEPS = ['Basic Info', 'Category & Location', 'Department & Purchase', 'QR Generation'];

export default function AssetRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ name: '', serialNo: '', category: '', location: '', department: '', purchaseDate: '', purchaseValue: '', vendor: '', warranty: '' });

    const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const QR_ID = `AST-${String(Math.floor(Date.now() % 10000)).padStart(4, '0')}`;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-white text-xl font-bold">Register New Asset</h1>
                <p className="text-slate-400 text-sm mt-0.5">Complete the form to register and generate QR code</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0">
                {STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    i === step ? 'bg-zinc-700 border-zinc-500 text-white' :
                                        'bg-zinc-900 border-slate-600 text-slate-400'}`}>
                                {i < step ? <CheckCircle size={16} /> : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 whitespace-nowrap hidden sm:block ${i === step ? 'text-zinc-300' : i < step ? 'text-emerald-400' : 'text-slate-500'}`}>{s}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                {step === 0 && (
                    <>
                        <h3 className="text-white font-semibold">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[['Asset Name', 'name', 'e.g. Dell Laptop Pro 15'], ['Serial Number', 'serialNo', 'e.g. DLTTG-2024-001']].map(([label, field, placeholder]) => (
                                <div key={field}>
                                    <label className="text-slate-300 text-xs font-medium mb-1.5 block">{label}</label>
                                    <input value={form[field]} onChange={e => update(field, e.target.value)} placeholder={placeholder}
                                        className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-zinc-500/60 transition-all" />
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {step === 1 && (
                    <>
                        <h3 className="text-white font-semibold">Category & Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Category</label>
                                <select value={form.category} onChange={e => update('category', e.target.value)}
                                    className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/60 cursor-pointer">
                                    <option value="">Select category</option>
                                    {['Electronics', 'Furniture', 'Networking', 'Lab Equipment', 'HVAC', 'Security', 'Electrical'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Location</label>
                                <select value={form.location} onChange={e => update('location', e.target.value)}
                                    className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/60 cursor-pointer">
                                    <option value="">Select location</option>
                                    {['Admin Block', 'Library', 'Lecture Hall A', 'Science Lab', 'Server Room', 'Conference Room', 'Staff Room', 'Seminar Hall'].map(l => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                    </>
                )}
                {step === 2 && (
                    <>
                        <h3 className="text-white font-semibold">Department & Purchase Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                ['Department', 'department', 'select', ['Administration', 'Finance', 'IT', 'Science', 'Library', 'Security', 'Facilities']],
                                ['Purchase Date', 'purchaseDate', 'date', []],
                                ['Purchase Value (₹)', 'purchaseValue', 'number', []],
                                ['Warranty (months)', 'warranty', 'number', []],
                            ].map(([label, field, type, opts]) => (
                                <div key={field}>
                                    <label className="text-slate-300 text-xs font-medium mb-1.5 block">{label}</label>
                                    {type === 'select' ? (
                                        <select value={form[field]} onChange={e => update(field, e.target.value)}
                                            className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/60 cursor-pointer">
                                            <option value="">Select</option>
                                            {opts.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={type} value={form[field]} onChange={e => update(field, e.target.value)}
                                            className="w-full bg-[#0e0e11]/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500/60 transition-all" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {step === 3 && (
                    <div className="text-center py-6">
                        <h3 className="text-white font-semibold mb-6">QR Code Generated</h3>
                        <div className="w-40 h-40 mx-auto bg-white rounded-2xl p-3 mb-4">
                            <div className="grid grid-cols-7 gap-0.5 h-full">
                                {[...Array(49)].map((_, i) => (
                                    <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? 'bg-[#0e0e11]' : 'bg-white'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">Asset ID: <span className="text-zinc-300 font-mono font-bold">{QR_ID}</span></p>
                        <p className="text-slate-500 text-xs mt-1">Scan QR code to track this asset</p>
                        <div className="mt-6 bg-[#0e0e11]/60 border border-zinc-800 rounded-xl p-4 text-left space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Name</span><span className="text-slate-200">{form.name || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Category</span><span className="text-slate-200">{form.category || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Location</span><span className="text-slate-200">{form.location || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Value</span><span className="text-slate-200">{form.purchaseValue ? `₹${parseInt(form.purchaseValue).toLocaleString()}` : 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <button
                    onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/assets')}
                    className="px-5 py-2.5 border border-zinc-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all"
                >
                    {step === 0 ? 'Cancel' : 'Back'}
                </button>
                <button
                    onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : navigate('/assets')}
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                    {step === STEPS.length - 1 ? 'Register Asset' : 'Next'} {step < STEPS.length - 1 && <ChevronRight size={16} />}
                </button>
            </div>
        </div>
    );
}
