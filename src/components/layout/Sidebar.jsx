import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp, ROLES } from '../../context/AppContext.jsx';
import {
    LayoutDashboard, Package, BarChart2, ShoppingCart, TrendingUp,
    Shield, QrCode, MapPin, Warehouse, Bell, Settings, ChevronLeft, X,
    ChevronRight, ReceiptText,
} from 'lucide-react';

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: null },
    { label: 'Assets', icon: Package, href: '/assets' },
    { label: 'Campus Map', icon: MapPin, href: '/campus' },
    { label: 'Inventory', icon: Warehouse, href: '/inventory' },
    {
        label: 'Procurement', icon: ShoppingCart, children: [
            { label: 'New Request', href: '/procurement/request' },
            { label: 'Approvals', href: '/procurement/approvals' },
            { label: 'History', href: '/procurement/history' },
        ]
    },
    { label: 'Analytics', icon: TrendingUp, href: '/analytics' },
    { label: 'Alerts', icon: Bell, href: '/alerts' },
    {
        label: 'Compliance', icon: Shield, children: [
            { label: 'Audit Trail', href: '/compliance/audit' },
            { label: 'Reports', href: '/compliance/reports' },
        ]
    },
    { label: 'QR Scanner', icon: QrCode, href: '/scanner' },
    { label: 'Bill Extractor', icon: ReceiptText, href: '/bills' },
];

function NavItem({ item, collapsed, dashboardHref }) {
    const [open, setOpen] = React.useState(false);
    const href = item.href === null ? dashboardHref : item.href;

    if (item.children) {
        return (
            <div>
                <button
                    onClick={() => setOpen(v => !v)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
                >
                    <item.icon size={17} className="shrink-0" />
                    {!collapsed && (
                        <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {open ? <ChevronLeft size={13} className="rotate-90" /> : <ChevronRight size={13} className="rotate-90" />}
                        </>
                    )}
                </button>
                {!collapsed && open && (
                    <div className="ml-7 mt-1 space-y-0.5 border-l border-zinc-700/50 pl-3">
                        {item.children.map(child => (
                            <NavLink
                                key={child.href}
                                to={child.href}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'text-zinc-100 bg-zinc-700/40' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'}`
                                }
                            >
                                {child.label}
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={href}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''}
        ${isActive
                    ? 'text-zinc-100 bg-zinc-800 border border-zinc-700/60'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'}`
            }
            title={collapsed ? item.label : undefined}
        >
            <item.icon size={17} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
        </NavLink>
    );
}

const LogoMark = () => (
    <div className="w-8 h-8 bg-zinc-800 border border-zinc-600/60 rounded-lg flex items-center justify-center shrink-0">
        <span className="text-zinc-100 font-bold text-sm tracking-tighter">CI</span>
    </div>
);

export default function Sidebar({ mobileOpen, onMobileClose }) {
    const { sidebarCollapsed, toggleSidebar, currentUser, getDashboardRoute } = useApp();
    const dashboardHref = getDashboardRoute(currentUser?.role);

    return (
        <>
            {/* Desktop sidebar */}
            <aside className={`hidden lg:flex flex-col bg-[#0c0c0e] border-r border-zinc-800/80 transition-all duration-300 shrink-0
        ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800/80">
                    <LogoMark />
                    {!sidebarCollapsed && (
                        <div>
                            <p className="text-white font-bold text-sm leading-none tracking-widest">CITRA</p>
                            <p className="text-zinc-500 text-[10px] mt-0.5">Resource & Asset Intelligence</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {navItems.map(item => (
                        <NavItem key={item.label} item={item} collapsed={sidebarCollapsed} dashboardHref={dashboardHref} />
                    ))}
                </nav>

                {/* Collapse toggle */}
                <div className="p-3 border-t border-zinc-800/80">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all text-xs"
                    >
                        {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
                    </button>
                </div>
            </aside>

            {/* Mobile sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col lg:hidden
        transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-800/80">
                    <div className="flex items-center gap-3">
                        <LogoMark />
                        <div>
                            <p className="text-white font-bold text-sm leading-none tracking-widest">CITRA</p>
                            <p className="text-zinc-500 text-[10px] mt-0.5">Resource & Asset Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onMobileClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
                        <X size={17} />
                    </button>
                </div>
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" onClick={onMobileClose}>
                    {navItems.map(item => (
                        <NavItem key={item.label} item={item} collapsed={false} dashboardHref={dashboardHref} />
                    ))}
                </nav>
            </aside>
        </>
    );
}
