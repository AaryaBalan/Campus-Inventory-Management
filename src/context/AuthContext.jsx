import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { storeToken, removeToken, authAPI } from '../utils/api';
import { localDatabase } from '../utils/localDatabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const fetchProfile = useCallback(async (demoHint = false) => {
        try {
            const res = await authAPI.getProfile();
            setProfile(res?.user || res || null);
        } catch (e) {
            // Silently fall back to a mock profile for demo smoothness
            if (demoHint || isDemoMode) {
                console.log('Using mock profile for Demo Mode');
                setProfile({
                    name: user?.email?.split('@')[0] || 'Demo User',
                    role: 'admin',
                    department: 'Campus Administration',
                    email: user?.email || 'demo@citil.com'
                });
            } else {
                console.warn('Profile fetch failed:', e.message);
            }
        }
    }, [isDemoMode, user]);

    useEffect(() => {
        const init = async () => {
            await localDatabase.initialize();
            setIsDemoMode(await localDatabase.isDemoMode());
        };
        init();

        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                try {
                    const idToken = await fbUser.getIdToken(false);
                    await storeToken(idToken);
                    setToken(idToken);
                    setUser(fbUser);

                    const demo = await localDatabase.isDemoMode();
                    await fetchProfile(demo);
                } catch (e) {
                    console.error('Token error:', e);
                }
            } else {
                await removeToken();
                setToken(null);
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, [fetchProfile]);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await cred.user.getIdToken();
            await storeToken(idToken);
            setToken(idToken);
            setUser(cred.user);

            // Explicitly fetch profile after login to get the role
            const profileData = await authAPI.getProfile();
            setProfile(profileData?.user || profileData || null);

            return cred.user;
        } catch (err) {
            const msg = parseFirebaseError(err.code);
            setError(msg);
            throw new Error(msg);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Clear local state first for immediate UI response
            setUser(null);
            setToken(null);
            setProfile(null);

            // Clear storage
            await removeToken();

            // Finally sign out from Firebase
            await signOut(auth);
        } catch (e) {
            console.warn('Logout error:', e);
            // Ensure state is cleared even on error
            setUser(null);
            setToken(null);
            setProfile(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            token,
            loading,
            error,
            login,
            logout,
            clearError: () => setError(null),
            isAuthenticated: !!user,
            userRole: profile?.role || null,
            userEmail: user?.email || null,
            isDemoMode,
            toggleDemoMode: async () => {
                const newVal = !isDemoMode;
                await localDatabase.setDemoMode(newVal);
                setIsDemoMode(newVal);
            },
            resetDemoData: async () => {
                await localDatabase.clear();
                await localDatabase.initialize(true);
                setIsDemoMode(true);
            }
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
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/invalid-email':
            return 'Please enter a valid email.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection.';
        default:
            return 'Login failed. Please try again.';
    }
}
