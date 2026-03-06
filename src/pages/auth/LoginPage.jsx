import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, ROLES } from '../../context/AppContext.jsx';
import { Shield, BarChart2, Package, Warehouse, User, TrendingUp, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const roleCards = [
    { role: ROLES.ADMIN, icon: Shield, color: 'zinc', desc: 'Full system access', name: 'Admin User' },
    { role: ROLES.FINANCE, icon: BarChart2, color: 'green', desc: 'Financial oversight', name: 'Finance Manager' },
    { role: ROLES.INVENTORY, icon: Warehouse, color: 'amber', desc: 'Stock management', name: 'Inventory Manager' },
    { role: ROLES.DEPARTMENT, icon: Package, color: 'purple', desc: 'Dept. assets & requests', name: 'Dr. Patel' },
    { role: ROLES.AUDITOR, icon: Shield, color: 'red', desc: 'Audit & compliance', name: 'Senior Auditor' },
    { role: ROLES.EXECUTIVE, icon: TrendingUp, color: 'slate', desc: 'Executive KPIs', name: 'Director' },
];

const colorMap = {
    zinc: { bg: 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-500', icon: 'text-zinc-200', selected: 'border-zinc-400 bg-zinc-700/60' },
    green: { bg: 'bg-emerald-500/10 border-emerald-700/40 hover:border-emerald-500/60', icon: 'text-emerald-400', selected: 'border-emerald-500 bg-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10 border-amber-700/40 hover:border-amber-500/60', icon: 'text-amber-400', selected: 'border-amber-500 bg-amber-500/20' },
    purple: { bg: 'bg-purple-500/10 border-purple-700/40 hover:border-purple-500/60', icon: 'text-purple-400', selected: 'border-purple-500 bg-purple-500/20' },
    red: { bg: 'bg-red-500/10 border-red-700/40 hover:border-red-500/60', icon: 'text-red-400', selected: 'border-red-500 bg-red-500/20' },
    slate: { bg: 'bg-slate-700/30 border-slate-600/40 hover:border-slate-500/60', icon: 'text-slate-300', selected: 'border-slate-400 bg-slate-600/40' },
};

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, getDashboardRoute } = useApp();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (!selectedRole) return;
        setLoading(true);
        const card = roleCards.find(r => r.role === selectedRole);
        setTimeout(() => {
            login(selectedRole, card?.name || 'User');
            navigate(getDashboardRoute(selectedRole));
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0c0c0e] flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-[#0e0e11] border-r border-zinc-800/60 flex-col items-center justify-center p-12">
                {/* Subtle grid overlay */}
                <div className="absolute inset-0"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative text-center z-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800 border border-zinc-600/60 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-black text-2xl tracking-tighter">CI</span>
                    </div>
                    <h1 className="text-white text-4xl font-black mb-2 tracking-widest">CITIL</h1>
                    <p className="text-zinc-400 text-sm mb-1">Campus Inventory, Asset &</p>
                    <p className="text-zinc-400 text-sm mb-10">Material Traceability Platform</p>
                    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                        {[['97.8%', 'Asset Traceability'], ['44hrs', 'Reconciliation'], ['₹4.25Cr', 'Assets Managed']].map(([val, label]) => (
                            <div key={label} className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3 text-center">
                                <p className="text-zinc-100 font-bold text-base">{val}</p>
                                <p className="text-zinc-500 text-[10px] mt-0.5 leading-tight">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel (login form) */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-10 h-10 bg-zinc-800 border border-zinc-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black text-sm">CI</span>
                        </div>
                        <div>
                            <p className="text-white font-black text-xl tracking-widest">CITIL</p>
                            <p className="text-zinc-500 text-xs">Campus Inventory Platform</p>
                        </div>
                    </div>

                    <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
                    <p className="text-zinc-500 text-sm mb-7">Select your role and sign in to continue</p>

                    {/* Role selector */}
                    <div className="mb-6">
                        <label className="text-zinc-400 text-xs font-medium mb-3 block uppercase tracking-wider">Select Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {roleCards.map(({ role, icon: Icon, color, desc }) => {
                                const c = colorMap[color];
                                const isSelected = selectedRole === role;
                                return (
                                    <button
                                        key={role}
                                        onClick={() => setSelectedRole(role)}
                                        className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer
                      ${isSelected ? c.selected + ' border-2' : c.bg}`}
                                    >
                                        <Icon size={17} className={`mx-auto mb-1.5 ${isSelected ? c.icon : 'text-zinc-500'}`} />
                                        <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{role}</p>
                                        <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Email Address</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                <input type="email" defaultValue="admin@campus.edu"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Password</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                <input type={showPass ? 'text' : 'password'} defaultValue="••••••••"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-all" />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedRole || loading}
                            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 mt-2
                ${selectedRole && !loading
                                    ? 'bg-zinc-100 hover:bg-white text-zinc-900 cursor-pointer shadow-lg shadow-black/40'
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-zinc-400/30 border-t-zinc-800 rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-zinc-600 text-xs text-center mt-6">
                        Campus Inventory & Traceability Platform · v2.0.1
                    </p>
                </div>
            </div>
        </div>
    );
}
