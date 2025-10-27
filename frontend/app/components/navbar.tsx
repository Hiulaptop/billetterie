// frontend/app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useAuth } from './AuthProvider'; // Import useAuth
import { useRouter } from "next/navigation";

export function Navbar() {
    const { user, logout, isAdmin } = useAuth(); // Lấy user và hàm logout, isAdmin
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/'); // Chuyển về trang chủ sau khi logout
    };

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto h-16 flex items-center gap-6">
                <Link href="/" className="text-xl font-bold text-gray-800 mr-auto">
                    Billetterie {/* Hoặc dùng Logo SVG nếu bạn có */}
                </Link>

                {user ? (
                    <>
                        {/* Hiển thị nút Add Event nếu là Admin */}
                        {isAdmin && (
                            <Link href="/event/create" className="text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md">
                                Add Event
                            </Link>
                        )}
                        <span className="text-sm text-gray-600">Chào, {user.username}!</span>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Login
                        </Link>
                        <Link href="/signup" className="text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}