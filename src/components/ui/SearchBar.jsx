import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '', onFilter }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-zinc-500/60 focus:bg-zinc-900 transition-all"
                />
            </div>
            {onFilter && (
                <button
                    onClick={onFilter}
                    className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-all"
                >
                    <SlidersHorizontal size={16} />
                </button>
            )}
        </div>
    );
}
