import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function Layout() {
    const { sidebarCollapsed } = useApp();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#0c0c0e] overflow-hidden">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/70 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

            {/* Main content */}
            <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300`}>
                <Header onMenuClick={() => setMobileOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0e0e10]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
