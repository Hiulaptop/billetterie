// frontend/app/components/Navbar.tsx
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useState } from "react";
import dynamic from "next/dynamic";

const QRCodeCanvas = dynamic(() => import("qrcode.react").then(mod => mod.QRCodeCanvas), { ssr: false });

export function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();

    const [searchEmail, setSearchEmail] = useState('');
    const [tickets, setTickets] = useState<any[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [errorSearch, setErrorSearch] = useState<string | null>(null);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleSearch = async () => {
        if (!searchEmail.trim()) return alert('Vui lòng nhập email để tìm kiếm.');
        setLoadingSearch(true);
        setErrorSearch(null);
        setTickets([]);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/find-by-email?email=${encodeURIComponent(searchEmail)}`);
            if (!res.ok) throw new Error('Không thể tìm vé cho email này.');
            const data = await res.json();
            setTickets(data);
        } catch (err: any) {
            setErrorSearch(err.message);
        } finally {
            setLoadingSearch(false);
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto h-16 flex items-center gap-4 px-4">
                <Link href="/" className="text-xl font-bold text-gray-800 mr-auto">
                    Kìm Nên Ngay
                </Link>

                {/* Search Email */}
                <div className="flex items-center gap-2">
                    <input
                        type="email"
                        placeholder="Tìm vé bằng email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="border rounded px-3 py-1 w-48 text-sm focus:ring focus:ring-blue-300 outline-none"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition text-sm"
                    >
                        {loadingSearch ? 'Đang tìm...' : 'Tìm'}
                    </button>
                </div>

                {user ? (
                    <div className="flex items-center gap-4 ml-4">
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
                    <div className="flex items-center gap-4 ml-4">
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

            {/* Search Results */}
            {tickets.length > 0 && (
                <div className="bg-white border-t border-gray-200 p-4 max-h-[400px] overflow-y-auto shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Kết quả tìm kiếm cho "{searchEmail}"</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tickets.map((t, idx) => (
                            <div key={t.ticketCode || idx} className="border p-3 rounded-lg shadow-sm">
                                <p className="font-semibold text-gray-800">{t.ticketCode}</p>
                                <p>Khách hàng: {t.customerName}</p>
                                <p>Email: {t.customerEmail}</p>
                                <p>Loại vé: {t.ticketClass?.name || '—'}</p>
                                <p>Ngày mua: {new Date(t.purchaseDate).toLocaleString()}</p>
                                <QRCodeCanvas
                                    value={`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/checkin/${t.ticketCode}`}
                                    size={120}
                                    level="H"
                                    className="mt-2"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {errorSearch && (
                <div className="bg-red-50 text-red-700 p-2 border border-red-200">
                    {errorSearch}
                </div>
            )}
        </nav>
    );
}
