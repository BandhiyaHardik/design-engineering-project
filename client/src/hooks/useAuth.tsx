import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { loadAllData, validateCredentials } from '@/data/mockData';
import { api } from '@/data/api';

const STORAGE_KEY = 'mitra_user_id';

const GUEST_USER: User = {
    id: '', name: 'Guest', email: '', role: 'student',
    clubIds: [], interests: [], createdAt: new Date().toISOString()
};

interface AuthContextValue {
    currentUser: User;
    login: (user: User) => void;
    logout: () => void;
    isLoggedIn: boolean;
    isLoading: boolean;
    loginWithCredentials: (email: string, password: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue>({
    currentUser: GUEST_USER,
    login: () => { },
    logout: () => { },
    isLoggedIn: false,
    isLoading: true,
    loginWithCredentials: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                await loadAllData();
                const savedId = localStorage.getItem(STORAGE_KEY);
                if (savedId) {
                    try {
                        const user = await api.getUser(savedId) as any;
                        if (user) {
                            const normalized: User = {
                                ...user,
                                id: user._id || user.id,
                            };
                            delete (normalized as any)._id;
                            delete (normalized as any).__v;
                            setCurrentUser(normalized);
                            setIsLoggedIn(true);
                        }
                    } catch {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }
            } catch (err) {
                console.error('Failed to initialize:', err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const login = (user: User) => {
        localStorage.setItem(STORAGE_KEY, user.id);
        setCurrentUser(user);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setCurrentUser(GUEST_USER);
        setIsLoggedIn(false);
    };

    const loginWithCredentials = async (email: string, password: string): Promise<User | null> => {
        const user = await validateCredentials(email, password);
        if (user) {
            login(user);
        }
        return user;
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, isLoggedIn, isLoading, loginWithCredentials }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
