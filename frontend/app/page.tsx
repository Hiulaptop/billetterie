// frontend/app/page.tsx
"use client"
import React, { useEffect, useState } from "react";
import EventItem from "@/app/components/event-item"; // Đảm bảo tên component đúng
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider"; // Import useAuth

type EventBasic = {
    id: number;
    title: string;
    description: string; // Backend đang trả về description
    shortkey: string | null;
    createdAt: string;
};

export default function Home() {
    const [events, setEvents] = useState<EventBasic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = useAuth(); // Lấy isAdmin và trạng thái loading auth

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true); // Bắt đầu loading khi fetch
            setError(null);
            try {
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch events.' }));
                    throw new Error(errorData.message || 'Failed to fetch events.');
                }

                const data: EventBasic[] = await response.json();
                // console.log(data)
                setEvents(data);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false); // Kết thúc loading
            }
        };

        fetchEvents();
    }, []); // Chỉ fetch một lần khi component mount

    // Kết hợp trạng thái loading của fetch và auth
    const showLoading = loading;
    console.log("✅ API URL:", process.env.NEXT_PUBLIC_API_URL);

    return (
        <div className="container mx-auto flex flex-col gap-8">


            {/* Optional: Nút Add Event chỉ hiển thị cho Admin */}
            {isAdmin && ( // Chỉ hiện khi không loading auth và là admin
                <div className="text-right">
                    <Link href="/event/create" className="inline-block bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                        + Add New Event
                    </Link>
                </div>
            )}

            {showLoading ? ( // Hiển thị loading khi đang fetch hoặc đang kiểm tra auth
                <p className="text-center text-gray-500">Loading events...</p>
            ) : error ? ( // Hiển thị lỗi nếu có
                <p className="text-center text-red-600">Error: {error}</p>
            ) : events.length === 0 ? ( // Hiển thị khi không có event nào
                <p className="text-center text-gray-500">No events found.</p>
            ) : (
                // Hiển thị danh sách event
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((item) => (
                        // Truyền đủ props cần thiết cho EventItem
                        <EventItem key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}