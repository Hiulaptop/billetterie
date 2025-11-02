'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

interface AuthContextType {
    token: string | null;
    status: 'loading' | 'authenticated' | 'unauthenticated'; // Thêm status
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    // Thêm state cho status
    const [status, setStatus] = useState<
        'loading' | 'authenticated' | 'unauthenticated'
    >('loading');

    useEffect(() => {
        // Khi component mount, kiểm tra cookie để duy trì đăng nhập
        const accessToken = getCookie('access_token');
        if (accessToken) {
            setToken(accessToken as string);
            setStatus('authenticated');
        } else {
            setStatus('unauthenticated');
        }
    }, []);

    const login = (accessToken: string, refreshToken: string) => {
        setToken(accessToken);
        setCookie('access_token', accessToken, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        setCookie('refresh_token', refreshToken, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        setStatus('authenticated');
    };

    const logout = () => {
        setToken(null);
        deleteCookie('access_token');
        deleteCookie('refresh_token');
        setStatus('unauthenticated');
    };

    return (
        <AuthContext.Provider value={{ token, status, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
