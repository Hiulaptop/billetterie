'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';

// ==== Kiểu dữ liệu người dùng ====
interface User {
    id: number;
    username: string;
    email: string;
    role?: string;
}

// ==== Interface context ====
interface AuthContextType {
    token: string | null;
    user: User | null;
    isAdmin: boolean;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    login: (token: string) => Promise<void>;
    logout: () => void;
}

// ==== Tạo context ====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==== Component Provider chính ====
export default function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

    // 🟢 Lấy token từ localStorage khi load trang
    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        if (savedToken) {
            setToken(savedToken);
            fetchUserInfo(savedToken);
        } else {
            setStatus('unauthenticated');
        }
    }, []);

    // 🟢 Hàm gọi API để lấy thông tin user
    const fetchUserInfo = async (accessToken: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!res.ok) throw new Error('Failed to fetch user info');

            const data = await res.json();
            setUser(data);
            setStatus('authenticated');
        } catch (error) {
            console.error('❌ Error fetching user info:', error);
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
            setStatus('unauthenticated');
        }
    };

    // 🟢 Hàm login (lưu token và load user)
    const login = async (accessToken: string) => {
        try {
            localStorage.setItem('access_token', accessToken);
            setToken(accessToken);
            await fetchUserInfo(accessToken);
        } catch (error) {
            console.error('Login error:', error);
            logout();
        }
    };

    // 🟢 Hàm logout
    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
    };

    // 🟢 Kiểm tra quyền admin
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAdmin,
                status,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ==== Hook tiện dụng ====
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
