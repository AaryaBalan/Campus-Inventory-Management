import React from 'react';

const variants = {
    primary: 'bg-zinc-700 hover:bg-zinc-600 text-white shadow-lg shadow-black/30',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30',
    warning: 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-900/30',
    ghost: 'bg-transparent hover:bg-zinc-800/60 text-zinc-300 hover:text-white',
    outline: 'bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600',
};

const sizes = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-base rounded-xl',
    xl: 'px-6 py-3 text-lg rounded-xl',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled = false, onClick, type = 'button', icon, ...props }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-2 font-medium transition-all duration-200 cursor-pointer
        ${variants[variant]} ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}`}
            {...props}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </button>
    );
}
