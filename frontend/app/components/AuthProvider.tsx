// frontend/app/components/AuthProvider.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Cài đặt: npm install jwt-decode

interface UserPayload {
    sub: number;
    username: string;
    role: string; // Hoặc enum Role nếu bạn định nghĩa ở frontend
}

interface AuthContextType {
    token: string | null;
    user: UserPayload | null;
    isAdmin: boolean;
    login: (newToken: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserPayload | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Thêm state loading

    useEffect(() => {
        // Chỉ chạy ở client-side
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode<UserPayload>(storedToken);
                // Kiểm tra hạn token nếu cần
                setToken(storedToken);
                setUser(decoded);
                setIsAdmin(decoded.role === 'admin'); // Backend trả về role 'admin'
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false); // Kết thúc loading sau khi kiểm tra token
    }, []);

    const login = (newToken: string) => {
        try {
            const decoded = jwtDecode<UserPayload>(newToken);
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(decoded);
            setIsAdmin(decoded.role === 'admin');
        } catch (error) {
            console.error("Failed to decode token on login:", error);
            logout(); // Nếu token không hợp lệ, đăng xuất
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAdmin(false);
    };

    // Không render gì cho đến khi xác định xong trạng thái auth ban đầu
    if (isLoading) {
        return null; // Hoặc một spinner/loading indicator
    }

    return (
        <AuthContext.Provider value={{ token, user, isAdmin, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};