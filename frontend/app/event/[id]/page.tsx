// frontend/app/event/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react'; // Thêm useCallback
import Image from 'next/image';
import Link from 'next/link';
import ShowtimeSelector from './components/ShowtimeSelector';
import TicketClassSelector from './components/TicketClassSelector';
import PurchaseForm from './components/PurchaseForm';
import { useAuth } from '@/app/components/AuthProvider';

// --- Types (giữ nguyên) ---
interface FieldOption { id: number; value: string; label: string | null; }
interface FormField {
    id: number;
    label: string;
    type: string;
    required: boolean;
    placeholder: string | null;
    options: FieldOption[];
    displayOrder: number;
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
// --- END Types ---

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const { user, token, isAdmin } = useAuth(); // Lấy đủ thông tin auth

    const eventId = params.id as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true); // Đổi tên state loading
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // States cho việc mua vé
    const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
    const [selectedTicketClassId, setSelectedTicketClassId] = useState<number | null>(null);
    const [ticketQuantity, setTicketQuantity] = useState<number>(1);

    // States loading riêng
    const [loadingPurchase, setLoadingPurchase] = useState(false); // State loading cho purchase
    const [loadingAdminIssue, setLoadingAdminIssue] = useState(false); // State loading cho admin issue
    const [adminIssueSuccess, setAdminIssueSuccess] = useState<string | null>(null); // Thông báo thành công

    // State và Effect fetch Ticket Classes
    const [tcData, setTcData] = useState<TicketClass[] | null>(null);
    const [loadingTc, setLoadingTc] = useState(false); // Loading riêng cho Ticket Class

    // --- Fetch Event Detail (giữ nguyên) ---
    useEffect(() => {
        if (!eventId) return;
        const fetchEventDetail = async () => {
            setLoadingEvent(true);
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
                setLoadingEvent(false);
            }
        };
        fetchEventDetail();
    }, [eventId]);

    // --- Fetch Ticket Classes khi Showtime thay đổi (tối ưu bằng useCallback) ---
    const fetchTicketClasses = useCallback(async (showtimeId: number) => {
        setLoadingTc(true);
        setError(null);
        setTcData(null);
        setSelectedTicketClassId(null);
        setTicketQuantity(1);
        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes?showtimeId=${showtimeId}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to fetch ticket classes (${response.status})`);
            }
            const data: TicketClass[] = await response.json();
            setTcData(data);
        } catch (err: any) {
            setError(`Error loading tickets: ${err.message}`);
        } finally {
            setLoadingTc(false);
        }
    }, []);

    useEffect(() => {
        if (selectedShowtimeId) {
            fetchTicketClasses(selectedShowtimeId);
        } else {
            setTcData(null);
        }
    }, [selectedShowtimeId, fetchTicketClasses]);

    // --- Hàm lấy Thumbnail URL (giữ nguyên) ---
    const getThumbnailUrl = (id: number) => {
        return `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/thumbnail`;
    };

    // --- Các giá trị được chọn (Sửa để lấy từ tcData) ---
    const selectedShowtime = event?.showtimes?.find(st => st.id === selectedShowtimeId);
    const selectedTicketClass = tcData?.find(tc => tc.id === selectedTicketClassId); // Lấy từ tcData

    // --- *** SỬA HÀM HANDLE PURCHASE (đã sửa ở lần trước, giữ nguyên) *** ---
    const handlePurchase = async (currentFormData: Record<string, any>) => {
        if (!selectedTicketClassId || !selectedShowtimeId || ticketQuantity < 1 || !eventId) {
            setError("Vui lòng chọn suất chiếu, loại vé và số lượng.");
            return;
        }
        if (!token) {
            setError("Vui lòng đăng nhập để mua vé.");
            return;
        }

        setError(null);
        setLoadingPurchase(true);

        try {
            const orderApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders/create-payment`;
            const orderPayload = {
                eventId: parseInt(eventId, 10), // Đảm bảo là số
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

            if (!response.ok) {
                const errMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                throw new Error(errMsg || 'Không thể tạo yêu cầu thanh toán.');
            }

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('Không nhận được liên kết thanh toán.');
            }
        } catch (err: any) {
            console.error("Purchase error:", err);
            setError(`Đặt vé thất bại: ${err.message}`);
            setLoadingPurchase(false);
        }
    };

    // --- Hàm Xóa Sự kiện (giữ nguyên) ---
    const handleDelete = async () => {
        // ... (Giữ nguyên logic hàm delete) ...
        if (!isAdmin || !token || !event) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${event.title}"? Hành động này không thể hoàn tác.`)) {
            return;
        }
        setIsDeleting(true);
        setError(null);
        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Xóa sự kiện thất bại.');
            }
            alert("Xóa sự kiện thành công!");
            router.push('/');
        } catch (err: any) {
            setError(err.message);
            setIsDeleting(false);
        }
    };

    // --- *** THÊM HÀM XUẤT VÉ CHO ADMIN (MỚI) *** ---
    const handleAdminIssueTickets = async () => {
        if (!isAdmin || !token || !selectedTicketClassId || ticketQuantity < 1) {
            setError("Vui lòng chọn loại vé, số lượng và đảm bảo bạn là Admin.");
            return;
        }

        setError(null);
        setAdminIssueSuccess(null);
        setLoadingAdminIssue(true);

        try {
            // Gọi API mới (đến TicketController)
            const issueApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tickets/admin-issue`;
            const issuePayload = {
                // Chỉ cần ticketClassId
                ticketClassId: selectedTicketClassId,
                quantity: ticketQuantity,
            };

            const response = await fetch(issueApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(issuePayload),
            });

            const data = await response.json();

            if (!response.ok) {
                const errMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                throw new Error(errMsg || 'Xuất vé thất bại.');
            }

            const firstTicketCode = data.issuedTickets?.[0]?.ticketCode;
            setAdminIssueSuccess(`Đã xuất thành công ${data.issuedTickets?.length || 0} vé. (Vd: ${firstTicketCode || 'N/A'})`);

        } catch (err: any) {
            console.error("Admin issue error:", err);
            setError(`Xuất vé thất bại: ${err.message}`);
        } finally {
            setLoadingAdminIssue(false);
        }
    };


    // --- Render ---
    if (loadingEvent && !event) return <p className="text-center text-gray-500">Đang tải chi tiết sự kiện...</p>;
    // Hiển thị lỗi rõ ràng
    if (error && !loadingPurchase && !loadingAdminIssue && !isDeleting) {
        return <p className="text-center text-red-600 p-4 bg-red-50 rounded border border-red-200">Lỗi: {error}</p>;
    }
    if (!event) return <p className="text-center text-gray-500">Không tìm thấy sự kiện.</p>;

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
            {/* Header: Title and Thumbnail (giữ nguyên) */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 items-start">
                <div className="w-full md:w-1D3 flex-shrink-0">
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
                    {event.shortkey && <p className="text-xs text-gray-400 font-mono mb-2">Code: {event.shortkey}</p>}
                    <p className="text-sm text-gray-600">{event.description}</p>

                    {/* Admin Buttons (Sửa lại link edit) */}
                    {isAdmin && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-4 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Admin:</span>
                            <Link
                                href={`/event/${eventId}/edit`} // Giữ link edit
                                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-500"
                            >
                                Chỉnh sửa
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || loadingAdminIssue || loadingPurchase}
                                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-500 disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa sự kiện'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hiển thị lỗi chung / loading / success */}
            {error && <p className="text-center text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">{error}</p>}
            {isDeleting && <p className="text-center text-gray-500 mb-4">Đang xóa sự kiện...</p>}
            {adminIssueSuccess && <p className="text-center text-green-600 mb-4 p-3 bg-green-50 rounded border border-green-200">{adminIssueSuccess}</p>}


            {/* Selection Area */}
            {!isDeleting && (
                <div className="space-y-6">
                    {/* 1. Showtime Selector */}
                    <ShowtimeSelector
                        showtimes={event.showtimes}
                        selectedShowtimeId={selectedShowtimeId}
                        onSelectShowtime={(id) => {
                            setSelectedShowtimeId(id); // Chỉ set ID, effect sẽ fetch TC
                        }}
                    />

                    {/* 2. Ticket Class Selector - Hiển thị loading khi đang fetch TC */}
                    {selectedShowtime && (
                        loadingTc ? (
                            <p className="text-center text-gray-500">Đang tải loại vé...</p>
                        ) : (
                            <TicketClassSelector
                                ticketClasses={tcData} // Dùng tcData đã fetch
                                selectedTicketClassId={selectedTicketClassId}
                                onSelectTicketClass={setSelectedTicketClassId}
                                quantity={ticketQuantity}
                                onQuantityChange={setTicketQuantity}
                            />
                        )
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

                    {/* 4. Purchase Form hoặc Nút thanh toán */}
                    {event.form && selectedTicketClassId && (
                        <PurchaseForm
                            formFields={event.form.fields}
                            onSubmit={handlePurchase}
                            isLoading={loadingPurchase}
                        />
                    )}
                    {!event.form && selectedTicketClassId && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => handlePurchase({})} // Gửi form data rỗng
                                disabled={loadingPurchase || loadingAdminIssue}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-500 disabled:opacity-50"
                            >
                                {loadingPurchase ? 'Đang xử lý...' : 'Thanh toán ngay'}
                            </button>
                        </div>
                    )}

                    {/* 5. *** NÚT XUẤT VÉ CHO ADMIN (MỚI) *** */}
                    {isAdmin && selectedTicketClassId && (
                        <div className="mt-6 pt-6 border-t border-dashed border-gray-300 text-center">
                            <h3 className="text-md font-semibold text-orange-700 mb-2">Admin: Xuất vé trực tiếp</h3>
                            <p className="text-xs text-gray-500 mb-3">(Vé được tạo sẽ có trạng thái "Đã thanh toán", bỏ qua PayOS)</p>
                            <button
                                onClick={handleAdminIssueTickets}
                                disabled={loadingAdminIssue || loadingPurchase || isDeleting}
                                className="bg-orange-600 text-white px-5 py-2 rounded-lg shadow hover:bg-orange-500 disabled:opacity-50"
                            >
                                {loadingAdminIssue ? 'Đang xuất vé...' : `Xuất ${ticketQuantity} vé (Admin)`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}