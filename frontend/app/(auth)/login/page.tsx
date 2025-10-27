// frontend/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider'; // Import useAuth

// ... (Các type LoginResponse, ErrorResponse giữ nguyên)
type LoginResponse = {
    access_token: string;
};

type ErrorResponse = {
    message: string | string[]; // Có thể là mảng lỗi validation
    error?: string;
    statusCode: number;
};


export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { login } = useAuth(); // Lấy hàm login từ context

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
        console.log('Attempting to log in at:', apiUrl); // Giữ lại để debug nếu cần

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data: LoginResponse | ErrorResponse = await response.json();

            if (!response.ok) {
                // Xử lý lỗi chi tiết hơn
                let errorMessage = 'Login failed. Please check your credentials.';
                // if (typeof data.message === 'string') {
                //     errorMessage = data.message;
                // } else if (Array.isArray(data.message)) {
                //     errorMessage = data.message.join(', ');
                // } else if ((data as ErrorResponse).error) {
                //     errorMessage = `${(data as ErrorResponse).error}: ${errorMessage}`;
                // }
                throw new Error(errorMessage);
            }

            // Đăng nhập thành công
            login((data as LoginResponse).access_token); // Gọi hàm login từ context
            router.push('/'); // Chuyển hướng về trang chủ

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            // Không chuyển hướng ở finally nữa vì đã chuyển ở try
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900">Login</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-gray-800 hover:text-gray-600">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}