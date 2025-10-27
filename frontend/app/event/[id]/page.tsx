// frontend/app/event/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Import Link cho nút Edit
import ShowtimeSelector from './components/ShowtimeSelector';
import TicketClassSelector from './components/TicketClassSelector';
import PurchaseForm from './components/PurchaseForm';
import { useAuth } from '@/app/components/AuthProvider';

// --- Định nghĩa Types (Đảm bảo các interface này có displayOrder) ---
interface FieldOption { id: number; value: string; label: string | null; }
interface FormField {
    id: number;
    label: string;
    type: string;
    required: boolean;
    placeholder: string | null;
    options: FieldOption[];
    displayOrder: number; // Đã thêm ở lần sửa trước
}
interface EventForm { id: number; title: string; description: string | null; fields: FormField[]; }
interface TicketClass { id: number; name: string; price: number; quantity: number | null; description: string | null; isActive: boolean; }
interface Showtime { id: number; start: string; end: string; location: string; description: string | null; ticketClasses: TicketClass[]; }
interface EventDetail {
    id: number;
    title: string;
    description: string;
    shortkey: string | null;
    createdAt: string;
    showtimes: Showtime[];
    form: EventForm | null;
}

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    // Lấy thêm isAdmin và token từ useAuth
    const { user, token, isAdmin } = useAuth();

    const eventId = params.id as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false); // State cho nút Xóa

    // ... (States cho việc mua vé) ...
    const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
    const [selectedTicketClassId, setSelectedTicketClassId] = useState<number | null>(null);
    const [ticketQuantity, setTicketQuantity] = useState<number>(1);
    // const [formData, setFormData] = useState<Record<string, any>>({}); // State này đã chuyển vào PurchaseForm

    const [tcData, setTcData] = useState<TicketClass[] | null>(null);
    useEffect(() => {
        if (!selectedShowtimeId || !event) {
            setTcData(null);
            return;
        }
        const fetchTC = async () => {
            setLoading(true);
            setError(null);
            try{
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes?showtimeId=${selectedShowtimeId}`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to fetch event details (${response.status})`);
                }
                const data: TicketClass[] = await response.json();
                setTcData(data);
            }
            catch (err: any) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }

        fetchTC();
    }, [selectedShowtimeId]);

    useEffect(() => {
        if (!eventId) return;

        const fetchEventDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`;
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to fetch event details (${response.status})`);
                }
                const data: EventDetail = await response.json();
                setEvent(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetail();
    }, [eventId]);

    // ... (Hàm getThumbnailUrl) ...
    const getThumbnailUrl = (id: number) => {
        return `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/thumbnail`;
    };

    const selectedShowtime = event?.showtimes?.find(st => st.id === selectedShowtimeId);
    const selectedTicketClass = selectedShowtime?.ticketClasses?.find(tc => tc.id === selectedTicketClassId);

    // ... (Hàm handlePurchase) ...
    const handlePurchase = async (currentFormData: Record<string, any>) => {
        // ... (Giữ nguyên logic của hàm handlePurchase) ...
        if (!selectedTicketClassId || !selectedShowtimeId || ticketQuantity < 1) {
            setError("Please select showtime, ticket class, and quantity.");
            return;
        }
        if (!token) {
            setError("Please login to purchase tickets.");
            return;
        }

        setError(null);
        setLoading(true); // Bắt đầu loading cho quá trình thanh toán

        try {
            const orderApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders/create-payment`;
            const orderPayload = {
                eventId: eventId,
                showtimeId: selectedShowtimeId,
                ticketClassId: selectedTicketClassId,
                quantity: ticketQuantity,
                formData: currentFormData,
            };

            const response = await fetch(orderApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create payment link.');
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('Payment link not received from backend.');
            }
        } catch (err: any) {
            console.error("Purchase error:", err);
            setError(`Purchase failed: ${err.message}`);
            setLoading(false);
        }
    };

    // === HÀM XÓA SỰ KIỆN (MỚI) ===
    const handleDelete = async () => {
        if (!isAdmin || !token || !event) return;

        // Xác nhận trước khi xóa
        if (!window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${event.title}"? Hành động này không thể hoàn tác.`)) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Xóa sự kiện thất bại.');
            }

            alert("Xóa sự kiện thành công!");
            router.push('/'); // Chuyển về trang chủ sau khi xóa thành công

        } catch (err: any) {
            setError(err.message);
            setIsDeleting(false); // Chỉ dừng loading nếu có lỗi
        }
        // Không cần setIsDeleting(false) ở finally nếu đã chuyển trang
    };


    // --- Render ---
    if (loading && !event) return <p className="text-center text-gray-500">Loading event details...</p>;
    // Cập nhật: Hiển thị lỗi ngay cả khi đang loading (ví dụ lỗi xóa)
    if (error && !isDeleting) return <p className="text-center text-red-600">Error: {error}</p>;
    if (!event) return <p className="text-center text-gray-500">Event not found.</p>;

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
            {/* Header: Title and Thumbnail */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 items-start">
                <div className="w-full md:w-1/3 flex-shrink-0">
                    <Image
                        src={getThumbnailUrl(event.id)}
                        alt={`Thumbnail for ${event.title}`}
                        width={400}
                        height={225}
                        className="rounded-lg object-cover w-full aspect-video"
                        unoptimized
                    />
                </div>
                <div className="flex-grow">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
                    <p className="text-sm text-gray-600">{event.description}</p>

                    {/* === ADMIN BUTTONS (MỚI) === */}
                    {isAdmin && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700">Admin:</span>
                            {/* Nút Chỉnh sửa (Bạn cần tạo trang /event/[id]/edit) */}
                            <Link
                                href={`/event/${eventId}/edit`}
                                className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-500"
                            >
                                Chỉnh sửa sự kiện
                            </Link>
                            {/* Nút Xóa */}
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-500 disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa sự kiện'}
                            </button>
                        </div>
                    )}
                    {/* === END ADMIN BUTTONS === */}
                </div>
            </div>

            {/* Hiển thị lỗi chung (bao gồm cả lỗi xóa) */}
            {error && <p className="text-center text-red-600 mb-4">{error}</p>}
            {isDeleting && <p className="text-center text-gray-500 mb-4">Đang xóa sự kiện...</p>}


            {/* Selection Area (Ẩn đi nếu đang xóa) */}
            {!isDeleting && (
                <div className="space-y-6">
                    {/* 1. Showtime Selector */}
                    <ShowtimeSelector
                        showtimes={event.showtimes}
                        selectedShowtimeId={selectedShowtimeId}
                        onSelectShowtime={(id) => {
                            setSelectedShowtimeId(id);
                            setSelectedTicketClassId(null);
                            setTicketQuantity(1);
                        }}
                    />

                    {/* 2. Ticket Class Selector */}
                    {selectedShowtime && (
                        <>
                        <p>
                            {selectedShowtimeId}
                        </p>
                        <TicketClassSelector
                            ticketClasses={tcData}
                            selectedTicketClassId={selectedTicketClassId}
                            onSelectTicketClass={setSelectedTicketClassId}
                            quantity={ticketQuantity}
                            onQuantityChange={setTicketQuantity}
                        />
                        </>
                    )}

                    {/* 3. Tổng tiền */}
                    {selectedTicketClass && (
                        <div className="p-4 bg-gray-100 rounded-md text-right">
                            <p className="text-sm text-gray-700">Số lượng: {ticketQuantity}</p>
                            <p className="text-lg font-semibold text-gray-900">
                                Tổng: {(selectedTicketClass.price * ticketQuantity).toLocaleString('vi-VN')} VND
                            </p>
                        </div>
                    )}

                    {/* 4. Purchase Form */}
                    {event.form && selectedTicketClassId && (
                        <PurchaseForm
                            formFields={event.form.fields}
                            onSubmit={handlePurchase}
                            isLoading={loading} // loading của thanh toán
                        />
                    )}
                    {!event.form && selectedTicketClassId && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => handlePurchase({})}
                                disabled={loading}
                                className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-700 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Proceed to Payment'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}