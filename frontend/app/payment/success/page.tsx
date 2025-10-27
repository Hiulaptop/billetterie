// frontend/app/payment/success/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider'; // Import useAuth


interface TicketInfo {
    ticketCode: string;
    // Thêm các thông tin khác nếu backend trả về (tên event, loại vé, showtime...)
}

interface OrderDetails {
    // Định nghĩa cấu trúc dữ liệu đơn hàng nếu cần fetch lại
    id: number;
    // ...
    formData: Record<string, any>; // Lưu lại form data ở đây
}

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const { token } = useAuth(); // Lấy token

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

    // Lấy thông tin từ URL params (PayOS thường trả về qua đây)
    const orderCode = searchParams.get('orderCode'); // Lấy orderCode từ PayOS
    const status = searchParams.get('status');

    useEffect(() => {
        // Chỉ fetch khi có orderCode, status là PAID và có token
        if (!orderCode || status !== 'PAID' || !token) {
            setError("Invalid payment confirmation request or not logged in.");
            setIsLoading(false);
            return;
        }

        const fetchTicketAndLog = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // **Giả định:** Gọi API Backend để lấy thông tin vé và order dựa trên orderCode từ PayOS
                // Backend cần xác thực token và kiểm tra xem user này có quyền xem orderCode này không
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders/confirmation/${orderCode}`; // **Cần tạo endpoint này**

                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch ticket information.');
                }

                // Giả sử backend trả về cả thông tin vé và chi tiết đơn hàng (bao gồm formData)
                const fetchedTicketInfo: TicketInfo = { ticketCode: data.ticketCode /* ... */ };
                const fetchedOrderDetails: OrderDetails = { formData: data.formData, id: data.orderId /* ... */};


                setTicketInfo(fetchedTicketInfo);
                setOrderDetails(fetchedOrderDetails);

                // --- LOGGING ---
                console.log("===== Payment Successful =====");
                console.log("Order Code (PayOS):", orderCode);
                console.log("Ticket Code:", fetchedTicketInfo.ticketCode);
                console.log("User Form Data:", fetchedOrderDetails.formData); // Log form data
                console.log("==============================");
                // --- END LOGGING ---

            } catch (err: any) {
                console.error("Error fetching ticket info:", err);
                setError(`Error processing payment confirmation: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTicketAndLog();

    }, [orderCode, status, token]); // Dependencies

    return (
        <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
            {isLoading && (
                <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing your payment confirmation...</p>
                </>
            )}
            {!isLoading && error && (
                <>
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-2xl font-semibold text-red-700 mb-2">Payment Processing Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="text-gray-700 hover:underline">
                        Return to Homepage
                    </Link>
                </>
            )}
            {!isLoading && !error && ticketInfo && orderDetails && (
                <>
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Payment Successful!</h1>
                    <p className="text-gray-600 mb-4">Your ticket information has been processed.</p>
                    <div className="bg-gray-100 p-4 rounded-md mb-6 text-left">
                        <p className="text-sm text-gray-700"><strong>PayOS Order Code:</strong> {orderCode}</p>
                        <p className="text-sm text-gray-700"><strong>Your Ticket Code:</strong> <span className="font-mono bg-gray-200 px-1 rounded">{ticketInfo.ticketCode}</span></p>
                        {/* Hiển thị thêm thông tin nếu muốn */}
                    </div>
                    <p className="text-sm text-gray-500 mb-6">(Check your browser's console for detailed log)</p>
                    <Link href="/" className="text-gray-700 hover:underline">
                        Return to Homepage
                    </Link>
                </>
            )}
            {/* Trường hợp không loading, không lỗi nhưng không có ticketInfo (ví dụ status != PAID) */}
            {!isLoading && !error && !ticketInfo && (
                <>
                    <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Payment Status</h1>
                    <p className="text-gray-600 mb-6">Payment status received: {status || 'Unknown'}. Ticket not generated yet.</p>
                    <Link href="/" className="text-gray-700 hover:underline">
                        Return to Homepage
                    </Link>
                </>
            )}
        </div>
    );
}