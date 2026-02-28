import React from 'react';

const variants = {
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-zinc-600/20 text-zinc-300 border border-zinc-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    neutral: 'bg-slate-700 text-slate-300 border border-slate-600',
    critical: 'bg-red-600/30 text-red-300 border border-red-500/50',
};

const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-2.5 py-1 text-xs rounded-lg',
    lg: 'px-3 py-1.5 text-sm rounded-lg',
};

export default function Badge({ children, variant = 'neutral', size = 'md', dot = false, className = '' }) {
    return (
        <span className={`inline-flex items-center gap-1.5 font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-400' :
                    variant === 'warning' ? 'bg-amber-400' :
                        variant === 'danger' || variant === 'critical' ? 'bg-red-400' :
                            variant === 'cyan' ? 'bg-cyan-400' :
                                'bg-blue-400'
                } animate-pulse`} />}
            {children}
        </span>
    );
}
