import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { storeToken, removeToken, authApi } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await authApi.getMe();
            setProfile(res?.user || res || null);
        } catch (e) {
            console.warn('Profile fetch failed:', e.message);
        }
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                try {
                    const idToken = await fbUser.getIdToken(false);
                    await storeToken(idToken);
                    setToken(idToken);
                    setUser(fbUser);
                    fetchProfile();
                } catch (e) { console.error('Token error:', e); }
            } else {
                await removeToken();
                setToken(null); setUser(null); setProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, [fetchProfile]);

    // Auto-refresh token every 50 minutes
    useEffect(() => {
        if (!user) return;
        const iv = setInterval(async () => {
            try {
                const fresh = await user.getIdToken(true);
                await storeToken(fresh);
                setToken(fresh);
            } catch (e) { console.error('Token refresh error:', e); }
        }, 50 * 60 * 1000);
        return () => clearInterval(iv);
    }, [user]);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await cred.user.getIdToken();
            await storeToken(idToken);
            setToken(idToken);
            setUser(cred.user);
            return cred.user;
        } catch (err) {
            const msg = parseFirebaseError(err.code);
            setError(msg);
            throw new Error(msg);
        }
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
        await removeToken();
        setUser(null); setToken(null); setProfile(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user, profile, token, loading, error,
            login, logout, clearError: () => setError(null),
            isAuthenticated: !!user,
            userRole: profile?.role || null,
            userEmail: user?.email || null,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};

function parseFirebaseError(code) {
    switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': return 'Invalid email or password.';
        case 'auth/invalid-email': return 'Please enter a valid email.';
        case 'auth/user-disabled': return 'This account has been disabled.';
        case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
        case 'auth/network-request-failed': return 'Network error. Check your connection.';
        default: return 'Login failed. Please try again.';
    }
}
