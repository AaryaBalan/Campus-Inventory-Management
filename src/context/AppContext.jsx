import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const { userRole } = useAuth();
    const [notificationsCount, setNotificationsCount] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeRole, setActiveRole] = useState(userRole);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => { if (userRole) setActiveRole(userRole); }, [userRole]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        setToastMessage({ message, type, id: Date.now() });
        setTimeout(() => setToastMessage(null), duration);
    }, []);

    return (
        <AppContext.Provider value={{
            notificationsCount,
            setNotificationBadge: setNotificationsCount,
            incrementNotifications: (n = 1) => setNotificationsCount(p => p + n),
            clearNotifications: () => setNotificationsCount(0),
            drawerOpen,
            openDrawer: () => setDrawerOpen(true),
            closeDrawer: () => setDrawerOpen(false),
            toggleDrawer: () => setDrawerOpen(p => !p),
            activeRole, setActiveRole,
            toastMessage, showToast,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
};
