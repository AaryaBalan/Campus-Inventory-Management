import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export const ROLES = {
    ADMIN: 'Admin',
    FINANCE: 'Finance',
    INVENTORY: 'Inventory Manager',
    DEPARTMENT: 'Department Head',
    AUDITOR: 'Auditor',
    EXECUTIVE: 'Executive',
};

const ROLE_ROUTES = {
    [ROLES.ADMIN]: '/dashboard/admin',
    [ROLES.FINANCE]: '/dashboard/finance',
    [ROLES.INVENTORY]: '/dashboard/inventory',
    [ROLES.DEPARTMENT]: '/dashboard/department',
    [ROLES.AUDITOR]: '/dashboard/auditor',
    [ROLES.EXECUTIVE]: '/dashboard/executive',
};

export const AppProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'warning', message: 'Low stock: Printer Cartridges (5 left)', time: '2m ago', read: false },
        { id: 2, type: 'critical', message: 'Unauthorized movement detected – Lab A', time: '15m ago', read: false },
        { id: 3, type: 'info', message: 'Purchase Request PR-2024-089 approved', time: '1h ago', read: true },
        { id: 4, type: 'warning', message: '3 assets pending annual verification', time: '3h ago', read: false },
        { id: 5, type: 'info', message: 'Monthly audit report ready for download', time: '1d ago', read: true },
    ]);

    const login = useCallback((role, name = 'John Doe') => {
        setCurrentUser({
            id: 'USR-001',
            name,
            role,
            email: `${name.toLowerCase().replace(' ', '.')}@campus.edu`,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
            department: 'Administration',
        });
    }, []);

    const logout = useCallback(() => setCurrentUser(null), []);

    const toggleTheme = useCallback(() =>
        setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);

    const toggleSidebar = useCallback(() =>
        setSidebarCollapsed(c => !c), []);

    const markNotificationRead = useCallback((id) => {
        setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    }, []);

    const getDashboardRoute = useCallback((role) => ROLE_ROUTES[role] || '/dashboard/admin', []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AppContext.Provider value={{
            currentUser, login, logout,
            theme, toggleTheme,
            sidebarCollapsed, toggleSidebar,
            notifications, unreadCount, markNotificationRead, markAllRead,
            getDashboardRoute,
        }}>
            <div className={theme === 'dark' ? 'dark' : ''}>
                {children}
            </div>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
