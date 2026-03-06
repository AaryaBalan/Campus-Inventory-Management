import React from 'react';
import { PackageOpen } from 'lucide-react';

export function LoadingSpinner({ size = 24 }) {
    return (
        <div className="flex items-center justify-center p-8">
            <div
                className="rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin"
                style={{ width: size, height: size }}
            />
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded-lg w-1/3 mb-3" />
            <div className="h-8 bg-slate-700 rounded-lg w-1/2 mb-2" />
            <div className="h-3 bg-slate-700 rounded-lg w-2/3" />
        </div>
    );
}

export function EmptyState({ title = 'No data found', description = 'Try adjusting your search or filters.', icon, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-zinc-900 rounded-2xl mb-4 text-slate-500">
                {icon || <PackageOpen size={40} />}
            </div>
            <h3 className="text-slate-200 font-semibold text-lg mb-1">{title}</h3>
            <p className="text-slate-500 text-sm mb-4 max-w-xs">{description}</p>
            {action}
        </div>
    );
}
