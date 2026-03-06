import React from 'react';

export default function Card({ children, className = '', hover = false, padding = true }) {
    return (
        <div className={`bg-zinc-900/70 border border-zinc-800/80 rounded-2xl
      ${padding ? 'p-6' : ''}
      ${hover ? 'hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200 cursor-pointer' : ''}
      ${className}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, action, icon }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && <div className="p-2 bg-zinc-800/80 rounded-xl">{icon}</div>}
                <div>
                    <h3 className="text-zinc-100 font-semibold text-sm">{title}</h3>
                    {subtitle && <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function KPICard({ title, value, subtitle, icon, trend, trendValue, color = 'zinc' }) {
    const colors = {
        zinc: { bg: 'bg-zinc-800/60', icon: 'text-zinc-300', border: 'border-zinc-700/60' },
        cyan: { bg: 'bg-zinc-700/30', icon: 'text-zinc-300', border: 'border-zinc-700/40' },
        green: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
        amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
        red: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
        purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
        blue: { bg: 'bg-zinc-800/60', icon: 'text-zinc-300', border: 'border-zinc-700/60' },
    };
    const c = colors[color] || colors.zinc;

    return (
        <div className={`bg-zinc-900/70 border ${c.border} rounded-2xl p-5 hover:bg-zinc-900 transition-all duration-200`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>}
                    {trendValue && (
                        <p className={`text-xs mt-2 font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend === 'up' ? '↑' : '↓'} {trendValue}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${c.bg}`}>
                    <span className={c.icon}>{icon}</span>
                </div>
            </div>
        </div>
    );
}

