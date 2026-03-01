import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AppContext = createContext(null);

// ── Role constants (must match backend custom claims) ────────────────────────
// Backend stores lowercase: 'admin','finance','inventory','department','auditor','executive'
// Frontend displays with spaces/caps. Map claim → display label.
const CLAIM_TO_ROLE = {
    admin: 'Admin',
    finance: 'Finance',
    inventory: 'Inventory Manager',
    department: 'Department Head',
    auditor: 'Auditor',
    executive: 'Executive',
};

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
    // null = loading (checking Firebase session), false/object = resolved
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [theme, setTheme] = useState('dark');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // ── Listen for Firebase auth state changes ──────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Force-refresh token to get latest custom claims
                const tokenResult = await firebaseUser.getIdTokenResult(true);
                const claims = tokenResult.claims;
                const claimRole = (claims.role || 'admin').toLowerCase();
                const displayRole = CLAIM_TO_ROLE[claimRole] || 'Admin';

                setCurrentUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email,
                    role: displayRole,
                    department: claims.department || null,
                    avatar: (firebaseUser.displayName || firebaseUser.email || 'U')
                        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                });
            } else {
                setCurrentUser(null);
            }
            setAuthLoading(false);
        });
        return unsub; // cleanup listener on unmount
    }, []);

    // ── Login with email + password ─────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged above will update currentUser automatically
        return cred;
    }, []);

    // ── Logout ──────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await signOut(auth);
        // onAuthStateChanged sets currentUser to null automatically
    }, []);

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

    // Show nothing while Firebase resolves the session (avoids flash-to-login)
    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <AppContext.Provider value={{
            currentUser, login, logout, authLoading,
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
