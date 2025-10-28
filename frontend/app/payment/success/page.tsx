// frontend/app/payment/success/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react'; // Import Suspense
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';

interface TicketInfo {
    ticketCode: string;
    status: string;
    ticketClass: string;
}

interface OrderDetails {
    orderId: number;
    formData: Record<string, any>;
    eventTitle: string;
    tickets: TicketInfo[];
}

// Component con để xử lý logic bất đồng bộ
function SuccessContent() {
    const searchParams = useSearchParams();
    const { token } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

    // Lấy thông tin từ URL params
    const orderCodeParam = searchParams.get('orderCode'); // Đây là orderCode của PayOS
    const status = searchParams.get('status');
    const code = searchParams.get('code'); // PayOS trả về '00' nếu thành công

    useEffect(() => {
        const payosOrderCode = orderCodeParam ? parseInt(orderCodeParam, 10) : null;

        // Chỉ fetch khi có payosOrderCode, code là '00' và có token
        if (!payosOrderCode || code !== '00' || !token) {
            let errorMsg = "Yêu cầu xác nhận thanh toán không hợp lệ";
            if (code !== '00' && status) {
                errorMsg += ` (Trạng thái: ${status})`;
            } else if (code === '00' && !token) { // Thanh toán OK nhưng chưa login
                errorMsg = "Thanh toán thành công. Vui lòng đăng nhập để xem vé của bạn.";
                // Cân nhắc lưu orderCode vào local storage và redirect login
            }
            setError(errorMsg);
            setIsLoading(false);
            return;
        }

        const fetchConfirmation = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Gọi API Backend (/orders/confirmation/:payosOrderCode)
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders/confirmation/${payosOrderCode}`;

                const response = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();

                if (!response.ok) {
                    const errMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                    throw new Error(errMsg || 'Không thể lấy thông tin xác nhận đơn hàng.');
                }

                setOrderDetails(data as OrderDetails);

                // --- LOGGING ---
                console.log("===== Payment Successful & Confirmed =====");
                console.log("PayOS Order Code:", payosOrderCode);
                console.log("Backend Order Details:", data);
                console.log("User Form Data:", data.formData);
                console.log("==========================================");
                // --- END LOGGING ---

            } catch (err: any) {
                console.error("Error fetching order confirmation:", err);
                setError(`Lỗi xử lý xác nhận thanh toán: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfirmation();

    }, [orderCodeParam, status, code, token]); // Thêm code vào dependencies

    // --- Render Logic ---
    return (
        <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
            {isLoading && (
                <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang xử lý xác nhận thanh toán...</p>
                </>
            )}
            {!isLoading && error && (
                <>
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-2xl font-semibold text-red-700 mb-2">Lỗi xử lý thanh toán</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="text-gray-700 hover:underline">
                        Quay về trang chủ
                    </Link>
                </>
            )}
            {!isLoading && !error && orderDetails && (
                <>
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Thanh toán thành công!</h1>
                    <p className="text-gray-600 mb-4">Bạn đã mua vé thành công cho sự kiện <strong>{orderDetails.eventTitle}</strong>.</p>

                    <div className="bg-gray-100 p-4 rounded-md mb-6 text-left space-y-2">
                        <p className="text-sm text-gray-700"><strong>Mã đơn hàng:</strong> {orderDetails.orderId}</p>
                        <p className="text-sm text-gray-700"><strong>Danh sách vé:</strong></p>
                        <ul className="list-disc list-inside pl-4">
                            {orderDetails.tickets.map((ticket) => (
                                <li key={ticket.ticketCode} className="text-sm">
                                    <span className="font-mono bg-gray-200 px-1 rounded">{ticket.ticketCode}</span>
                                    ({ticket.ticketClass})
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">(Kiểm tra console để xem log chi tiết)</p>
                    <Link href="/" className="text-gray-700 hover:underline">
                        Quay về trang chủ
                    </Link>
                </>
            )}
            {/* Trường hợp code không phải '00' hoặc thiếu thông tin */}
            {!isLoading && !error && !orderDetails && (
                <>
                    <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Trạng thái thanh toán</h1>
                    <p className="text-gray-600 mb-6">Trạng thái nhận được: {status || 'Không xác định'}.</p>
                    <Link href="/" className="text-gray-700 hover:underline">
                        Quay về trang chủ
                    </Link>
                </>
            )}
        </div>
    );
}

// Bọc component chính trong Suspense
export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<p className="text-center text-gray-600">Đang tải trang xác nhận...</p>}>
            <SuccessContent />
        </Suspense>
    );
}