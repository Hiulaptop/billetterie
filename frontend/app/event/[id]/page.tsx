'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ShowtimeSelector from './components/ShowtimeSelector';
import TicketClassSelector from './components/TicketClassSelector';
import PurchaseForm from './components/PurchaseForm';
import { useAuth } from '@/app/components/AuthProvider';
import JSZip from "jszip";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

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

export default function EventPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, token, isAdmin } = useAuth();

    const eventId = id as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
    const [selectedTicketClassId, setSelectedTicketClassId] = useState<number | null>(null);
    const [ticketQuantity, setTicketQuantity] = useState<number>(1);

    const [loadingPurchase, setLoadingPurchase] = useState(false);
    const [loadingAdminIssue, setLoadingAdminIssue] = useState(false);
    const [adminIssueSuccess, setAdminIssueSuccess] = useState<string | null>(null);

    const [tcData, setTcData] = useState<TicketClass[] | null>(null);
    const [loadingTc, setLoadingTc] = useState(false);

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

    // NEW: guest info + UI control + pending formData
    const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<Record<string, any> | null>(null);

    const fetchEventDetail = useCallback(async () => {
        try {
            setLoadingEvent(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`);
            if (!res.ok) throw new Error('Không thể tải sự kiện');
            setEvent(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingEvent(false);
        }
    }, [eventId]);

    useEffect(() => { fetchEventDetail(); }, [fetchEventDetail]);

    const fetchTicketClasses = useCallback(async (showtimeId: number) => {
        setLoadingTc(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket-classes?showtimeId=${showtimeId}`);
            if (!res.ok)  throw new Error('Không thể tải loại vé');
            setTcData(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingTc(false);
        }
    }, []);

    useEffect(() => {
        if (selectedShowtimeId) fetchTicketClasses(selectedShowtimeId);
        else setTcData(null);
    }, [selectedShowtimeId, fetchTicketClasses]);

    const getThumbnailUrl = (id: number) => `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/thumbnail`;
    const selectedTicketClass = tcData?.find(tc => tc.id === selectedTicketClassId);

    // Ensure ticketQuantity does not exceed available quantity when selectedTicketClass changes
    useEffect(() => {
        if (selectedTicketClass && typeof selectedTicketClass.quantity === 'number') {
            if (selectedTicketClass.quantity <= 0) {
                // if no tickets left, set quantity to 0
                setTicketQuantity(0);
            } else if (ticketQuantity > selectedTicketClass.quantity) {
                setTicketQuantity(selectedTicketClass.quantity);
            } else if (ticketQuantity < 1) {
                setTicketQuantity(1);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTicketClass]);

    // Helper: try to resolve name/email from various user shapes
    const resolveUserInfo = (u: any) => {
        if (!u) return { name: null, email: null };
        const emailCandidates = [
            u.email,
            u.user?.email,
            u.profile?.email,
            u.data?.email,
            u.attributes?.email,
            // sometimes auth provider nests under user
        ];
        const nameCandidates = [
            u.displayName,
            u.display_name,
            u.name,
            u.username,
            u.user?.displayName,
            u.user?.name,
            u.profile?.name,
        ];
        const email = emailCandidates.find(e => typeof e === 'string' && e.trim().length > 0) ?? null;
        const name = nameCandidates.find(n => typeof n === 'string' && n.trim().length > 0) ?? null;
        return { name, email };
    };

    // Modified handlePurchase: always send customerName & customerEmail.
    const handlePurchase = async (formData: Record<string, any>) => {
        if (!selectedShowtimeId || !selectedTicketClassId) return setError('Vui lòng chọn suất chiếu và loại vé.');

        // check availability again before proceeding
        if (selectedTicketClass && typeof selectedTicketClass.quantity === 'number') {
            if (selectedTicketClass.quantity <= 0) {
                return setError('Vé đã bán hết cho loại vé này.');
            }
            if (ticketQuantity > selectedTicketClass.quantity) {
                return setError(`Số lượng vượt quá vé còn lại (${selectedTicketClass.quantity}).`);
            }
        }

        // resolve user info robustly
        const resolved = resolveUserInfo(user);
        const resolvedName = resolved.name;
        const resolvedEmail = resolved.email;

        // If user not logged in AND guest info missing => show guest form and save pending formData
        // ALSO if user logged in but we couldn't resolve email => require guest form to collect email
        if ((!user && (!guestInfo.email.trim() || !guestInfo.name.trim()))
            || (user && !resolvedEmail)
        ) {
            // prefill guest name if available from resolvedName
            setGuestInfo(prev => ({ name: prev.name || (resolvedName ?? ''), email: prev.email || '' }));
            setPendingFormData(formData ?? {});
            setShowGuestForm(true);
            return;
        }

        setLoadingPurchase(true);
        try {

            // for debugging, keep log (can remove later)
            console.log('Creating order with user object:', user);
            console.log('Resolved email/name:', resolvedEmail, resolvedName);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    eventId: Number(eventId),
                    showtimeId: selectedShowtimeId,
                    ticketClassId: selectedTicketClassId,
                    quantity: ticketQuantity,
                    formData,
                    // ALWAYS include these two fields for backend
                    customerName: resolvedName || guestInfo.name,
                    customerEmail: resolvedEmail || guestInfo.email,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Không thể tạo đơn hàng');
            if (data.checkoutUrl) window.location.href = data.checkoutUrl;
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingPurchase(false);
        }
    };

    // When guest confirms the small form, proceed with saved pendingFormData
    const handleConfirmGuest = async () => {
        // basic client-side validation
        if (!guestInfo.email.trim() || !guestInfo.name.trim()) {
            setError('Vui lòng nhập tên và email để tiếp tục.');
            return;
        }
        setShowGuestForm(false);
        const toSend = pendingFormData ?? {};
        setPendingFormData(null);
        // call handlePurchase with saved formData
        await handlePurchase(toSend);
    };

    const [adminTickets, setAdminTickets] = useState<any[]>([]);
    const [orderId, setOrderId] = useState('');
    const [errorAdminIssue, setErrorAdminIssue] = useState<string | null>(null);
    const qrRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    const handleAdminIssue = async () => {
        if (!selectedShowtimeId) {
            alert("Vui lòng chọn suất chiếu trước khi xuất vé!");
            return;
        }

        if (!ticketQuantity || ticketQuantity <= 0) {
            alert("Số lượng vé phải lớn hơn 0!");
            return;
        }

        try {
            setLoadingAdminIssue(true);
            setErrorAdminIssue(null);
            setAdminTickets([]);

            const token = localStorage.getItem("access_token");
            if (!token) {
                alert("Vui lòng đăng nhập lại (thiếu token)");
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/issue-direct`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    showtimeId: selectedShowtimeId,
                    quantity: ticketQuantity,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể xuất vé.");

            if (!data.tickets?.length) {
                alert("Không có vé nào được tạo.");
                return;
            }

            setAdminTickets(data.tickets);
        } catch (err: any) {
            console.error(err);
            setErrorAdminIssue(err.message);
        } finally {
            setLoadingAdminIssue(false);
        }
    };

    const handleDownloadTicketByIndex = (idx: number) => {
        const canvas = qrRefs.current[idx];
        if (!canvas) {
            alert("Không tìm thấy QR canvas để tải.");
            return;
        }
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        const code = adminTickets[idx]?.ticketCode || `ticket-${idx}`;
        a.download = `${code}.png`;
        a.click();
    };

    const handleDownloadAllTickets = async () => {
        const zip = new JSZip();
        // ensure refs length matches tickets
        for (let i = 0; i < adminTickets.length; i++) {
            const canvas = qrRefs.current[i];
            if (!canvas) continue;
            const dataUrl = canvas.toDataURL("image/png");
            // dataUrl = data:image/png;base64,AAAA...
            const base64 = dataUrl.split(",")[1];
            const filename = `${adminTickets[i].ticketCode || `ticket-${i}`}.png`;
            zip.file(filename, base64, { base64: true });
        }
        const blob = await zip.generateAsync({ type: "blob" }); // typed as Blob
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "tickets.zip";
        a.click();
        // release object URL afterwards
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };

    const handleDelete = async () => {
        if (!isAdmin || !token) return;
        if (!confirm(`Xóa "${event?.title}"?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Xóa thất bại');
            alert('Đã xóa sự kiện!');
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loadingEvent)
        return (
            <div className="animate-pulse max-w-4xl mx-auto mt-10 bg-white rounded-lg p-8 shadow">
                <div className="h-48 bg-gray-200 rounded-md mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
        );

    if (error)
        return (
            <div className="max-w-3xl mx-auto p-6 mt-10 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Lỗi</h2>
                <p>{error}</p>
                <button onClick={fetchEventDetail} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition">
                    Thử lại
                </button>
            </div>
        );

    if (!event)
        return <p className="text-center text-gray-500 mt-10">Không tìm thấy sự kiện.</p>;

    const remainingText = (selectedTicketClass?.quantity == null)
        ? '—'
        : (selectedTicketClass.quantity > 0 ? `${selectedTicketClass.quantity} vé` : 'Hết vé');

    return (
        <div className="max-w-4xl mx-auto bg-white mt-10 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <Image
                    src={getThumbnailUrl(event.id)}
                    alt={event.title}
                    width={500}
                    height={280}
                    className="rounded-xl object-cover w-full md:w-1/2 shadow-sm"
                    unoptimized
                />
                <div className="flex flex-col justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
                        {event.shortkey && (
                            <p className="text-xs text-gray-400 font-mono mb-2">Mã: {event.shortkey}</p>
                        )}
                        <p className="text-gray-600 leading-relaxed">{event.description}</p>
                    </div>

                    {isAdmin && (
                        <div className="flex gap-3 mt-4">
                            <Link
                                href={`/event/${eventId}/edit`}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition"
                            >
                                Chỉnh sửa
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    )}
                    {(isAdmin || user?.role === 'staff') && (
                        <div className="mt-4">
                            <Link
                                href={`/event/${eventId}/tickets`}
                                className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-500 transition"
                            >
                                Xem tất cả vé
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <ShowtimeSelector
                    showtimes={event.showtimes}
                    selectedShowtimeId={selectedShowtimeId}
                    onSelectShowtime={setSelectedShowtimeId}
                />

                {selectedShowtimeId && (
                    loadingTc ? (
                        <p className="text-center text-gray-500">Đang tải loại vé...</p>
                    ) : (
                        <TicketClassSelector
                            ticketClasses={tcData}
                            selectedTicketClassId={selectedTicketClassId}
                            onSelectTicketClass={setSelectedTicketClassId}
                            quantity={ticketQuantity}
                            onQuantityChange={setTicketQuantity}
                        />
                    )
                )}

                {selectedTicketClass && (
                    <div className="p-4 bg-gray-50 rounded-lg text-right border">
                        <div className="flex justify-between items-start">
                            <div className="text-left">
                                <p className="text-gray-600 text-sm">Số lượng chọn: {ticketQuantity}</p>
                                <p className="text-sm text-gray-500">Còn lại: <span className="font-medium">{remainingText}</span></p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">
                                    {(selectedTicketClass.price * ticketQuantity).toLocaleString('vi-VN')}₫
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* show guest form when needed (minimal UI) */}
                {showGuestForm && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 mb-2">Vui lòng nhập tên và email để tiếp tục thanh toán.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Họ và tên"
                                value={guestInfo.name}
                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                className="border rounded px-3 py-2 w-full"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={guestInfo.email}
                                onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>
                        <div className="mt-3 flex gap-3">
                            <button
                                onClick={handleConfirmGuest}
                                className="bg-green-600 text-white px-4 py-2 rounded"
                            >
                                Xác nhận và tiếp tục
                            </button>
                            <button
                                onClick={() => setShowGuestForm(false)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {event.form && selectedTicketClassId ? (
                    <PurchaseForm
                        formFields={event.form.fields}
                        onSubmit={handlePurchase}
                        isLoading={loadingPurchase}
                    />
                ) : selectedTicketClassId ? (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => handlePurchase({})}
                            disabled={loadingPurchase}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-500 transition disabled:opacity-50"
                        >
                            {loadingPurchase ? 'Đang xử lý...' : ''}
                        </button>
                    </div>
                ) : null}

                {isAdmin && (
                    <div className="mt-10 pt-6 border-t border-dashed">
                        <h3 className="text-md font-semibold text-orange-700 mb-4 text-center">
                            🎟️ Xuất vé trực tiếp (Admin)
                        </h3>

                        <div className="flex items-center justify-center gap-3 mb-6">
                            <input
                                type="number"
                                min={1}
                                value={ticketQuantity}
                                onChange={(e) => {
                                    const v = Number(e.target.value || 0);
                                    // if selectedTicketClass has quantity, clamp admin input too
                                    if (selectedTicketClass && typeof selectedTicketClass.quantity === 'number') {
                                        const max = selectedTicketClass.quantity;
                                        setTicketQuantity(Math.max(1, Math.min(v, max)));
                                    } else {
                                        setTicketQuantity(Math.max(1, v));
                                    }
                                }}
                                className="border rounded-lg px-3 py-2 w-32 text-sm focus:ring focus:ring-orange-300 outline-none"
                                placeholder="Số lượng vé"
                            />
                            <button
                                onClick={handleAdminIssue}
                                disabled={loadingAdminIssue}
                                className="bg-orange-600 text-white px-5 py-2 rounded-lg shadow hover:bg-orange-500 transition disabled:opacity-50"
                            >
                                {loadingAdminIssue ? "Đang xuất..." : "Xuất vé"}
                            </button>
                        </div>

                        {/* Popup hiển thị vé */}
                        {adminTickets.length > 0 && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-[90%] md:w-[700px] max-h-[90vh] overflow-y-auto shadow-lg">
                                    <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">
                                        🎫 {adminTickets.length} vé đã được tạo
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
                                        {adminTickets.map((t, idx) => (
                                            <div
                                                key={t.ticketCode || idx}
                                                className="border p-4 rounded-lg bg-gray-50 shadow-sm text-center w-full max-w-[280px]"
                                            >
                                                <QRCodeCanvas
                                                    value={`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/checkin/${t.ticketCode}`}
                                                    size={180}
                                                    level="H"
                                                    ref={(node: HTMLCanvasElement | null) => {
                                                        qrRefs.current[idx] = node;
                                                    }}
                                                    className="mx-auto"
                                                />
                                                <p className="mt-3 font-semibold text-gray-800 text-sm break-all">
                                                    {t.ticketCode}
                                                </p>
                                                <button
                                                    onClick={() => handleDownloadTicketByIndex(idx)}
                                                    className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-500 transition"
                                                >
                                                    Tải vé
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                                        <button
                                            onClick={handleDownloadAllTickets}
                                            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-500 transition w-full sm:w-auto"
                                        >
                                            Tải tất cả
                                        </button>
                                        <button
                                            onClick={() => setAdminTickets([])}
                                            className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition w-full sm:w-auto"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                )}


            </div>
        </div>
    );
}
