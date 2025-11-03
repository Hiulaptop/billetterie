// frontend/app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto h-16 flex items-center gap-6 px-4">
                <Link href="/" className="text-xl font-bold text-gray-800 mr-auto">
                    Billetterie
                </Link>

                {user ? (
                    <div className="flex items-center gap-4">
                        {isAdmin && (
                            <Link
                                href="/event/create"
                                className="text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md"
                            >
                                Add Event
                            </Link>
                        )}

                        <span className="text-sm text-gray-700">
              Hello, <span className="font-semibold text-gray-900">{user.username}</span> 👋
            </span>

                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Login
                        </Link>
                        <Link
                            href="/signup"
                            className="text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
