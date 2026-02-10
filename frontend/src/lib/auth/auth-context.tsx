'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { keycloakAuth } from './oidc-client';
import { authApi } from '../api/auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in (only in browser)
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('jwt_token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        }

        setLoading(false);
    }, []);

    const login = async () => {
        await keycloakAuth.login();
    };

    const setAuth = (user: User, token: string) => {
        setUser(user);
        setToken(token);
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user', JSON.stringify(user));
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setToken(null);
            await keycloakAuth.logout();
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        setAuth,
        isAuthenticated: !!user && !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
