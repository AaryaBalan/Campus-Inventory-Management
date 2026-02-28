import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Sun, Moon, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function Header({ onMenuClick }) {
    const { currentUser, theme, toggleTheme, notifications, unreadCount, markAllRead, logout, getDashboardRoute } = useApp();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const severityDot = { critical: 'bg-red-400', warning: 'bg-amber-400', info: 'bg-zinc-400' };

    return (
        <header className="bg-[#0c0c0e]/95 border-b border-zinc-800/80 backdrop-blur-sm px-4 md:px-6 h-16 flex items-center gap-4 shrink-0 z-20">
            {/* Mobile menu */}
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white">
                <Menu size={20} />
            </button>

            {/* Logo (mobile) */}
            <div className="flex items-center gap-2 lg:hidden">
                <div className="w-7 h-7 bg-zinc-700 rounded-lg flex items-center justify-center border border-zinc-600">
                    <span className="text-white font-bold text-xs">CI</span>
                </div>
                <span className="text-white font-bold text-sm hidden sm:block tracking-widest">CITIL</span>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search assets, requests, reports..."
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
                />
            </div>

            <div className="flex-1 md:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
                        className="relative p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                        <Bell size={17} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/60">
                                <span className="text-white font-semibold text-sm">Notifications</span>
                                <button onClick={markAllRead} className="text-zinc-400 text-xs hover:text-zinc-200 transition-colors">Mark all read</button>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-3.5 border-b border-zinc-700/30 hover:bg-zinc-800/50 transition-colors ${!n.read ? 'bg-zinc-800/30' : ''}`}>
                                        <div className="flex items-start gap-2.5">
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? (severityDot[n.type] || 'bg-zinc-400') : 'bg-zinc-600'}`} />
                                            <div>
                                                <p className="text-zinc-200 text-xs leading-relaxed">{n.message}</p>
                                                <p className="text-zinc-500 text-xs mt-1">{n.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="relative ml-1" ref={profileRef}>
                    <button
                        onClick={() => { setShowProfile(v => !v); setShowNotifications(false); }}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-zinc-700 border border-zinc-500/40 flex items-center justify-center text-zinc-200 font-bold text-xs">
                            {currentUser?.avatar}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-zinc-100 text-xs font-medium leading-none">{currentUser?.name}</p>
                            <p className="text-zinc-500 text-[11px] mt-0.5">{currentUser?.role}</p>
                        </div>
                        <ChevronDown size={13} className="text-zinc-500 hidden md:block" />
                    </button>
                    {showProfile && (
                        <div className="absolute right-0 top-12 w-52 bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                            <div className="px-4 py-3 border-b border-zinc-700/60">
                                <p className="text-white font-medium text-sm">{currentUser?.name}</p>
                                <p className="text-zinc-400 text-xs mt-0.5">{currentUser?.email}</p>
                            </div>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm transition-colors">
                                <User size={14} /> Profile Settings
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm transition-colors">
                                <Settings size={14} /> Preferences
                            </button>
                            <div className="border-t border-zinc-700/60 mt-1 pt-1">
                                <button
                                    onClick={() => { logout(); navigate('/login'); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                                >
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
