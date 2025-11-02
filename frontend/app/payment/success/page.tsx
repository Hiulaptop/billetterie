'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/app/components/skeleton';

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

function SuccessContent() {
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

    const orderCodeParam = searchParams.get('orderCode');
    const status = searchParams.get('status');
    const code = searchParams.get('code');

    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

    useEffect(() => {
        const payosOrderCode = orderCodeParam
            ? parseInt(orderCodeParam, 10)
            : null;

        if (!payosOrderCode || code !== '00') {
            let errorMsg = 'Yêu cầu xác nhận thanh toán không hợp lệ';
            if (code !== '00' && status) {
                errorMsg += ` (Trạng thái: ${status})`;
            }
            setError(errorMsg);
            setIsLoading(false);
            return;
        }

        const fetchConfirmation = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log('Fetching order confirmation for PayOS Order Code:', payosOrderCode);
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders/confirmation/${payosOrderCode}`;

                // ❌ Bỏ header Authorization, vì không cần token
                const response = await fetch(apiUrl);

                const data = await response.json();

                if (!response.ok) {
                    const errMsg = Array.isArray(data.message)
                        ? data.message.join(', ')
                        : data.message;
                    throw new Error(errMsg || 'Không thể lấy thông tin xác nhận đơn hàng.');
                }

                setOrderDetails(data as OrderDetails);

                console.log('===== Payment Successful & Confirmed =====');
                console.log('PayOS Order Code:', payosOrderCode);
                console.log('Backend Order Details:', data);
                console.log('==========================================');
            } catch (err: any) {
                console.error('Error fetching order confirmation:', err);
                setError(`Lỗi xử lý xác nhận thanh toán: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfirmation();
    }, [orderCodeParam, status, code]);

    if (isLoading) {
        return (
            <div className="text-center max-w-lg mx-auto p-8">
                <Loader2 className="animate-spin h-12 w-12 text-gray-900 mx-auto mb-4" />
                <p className="text-gray-600">Đang xử lý xác nhận thanh toán...</p>
                <Skeleton className="h-8 w-3/4 mx-auto mt-6" />
                <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!isLoading && error) {
        return (
            <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-red-700 mb-2">
                    Lỗi xử lý thanh toán
                </h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link href="/" className="text-gray-700 hover:underline">
                    Quay về trang chủ
                </Link>
            </div>
        );
    }

    if (!isLoading && !error && orderDetails) {
        return (
            <div className="text-center max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                    Thanh toán thành công!
                </h1>
                <p className="text-gray-600 mb-4">
                    Bạn đã mua vé thành công cho sự kiện{' '}
                    <strong>{orderDetails.eventTitle}</strong>.
                </p>

                <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
                    <p className="text-sm text-gray-700">
                        <strong>Mã đơn hàng:</strong> {orderDetails.orderId}
                    </p>
                </div>

                <h2 className="text-xl font-semibold text-gray-700 mb-4">Vé của bạn</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Sử dụng các mã QR này để check-in tại sự kiện.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {orderDetails.tickets.map((ticket) => (
                        <div
                            key={ticket.ticketCode}
                            className="border rounded-lg p-4 flex flex-col items-center space-y-3 bg-gray-50"
                        >
                            <h3 className="text-lg font-semibold text-gray-800">
                                {ticket.ticketClass}
                            </h3>
                            <QRCodeCanvas
                                value={`${frontendUrl}/checkin/${ticket.ticketCode}`}
                                size={180}
                                level="H"
                            />
                            <p className="font-mono bg-gray-200 px-2 py-1 rounded text-sm text-gray-900">
                                {ticket.ticketCode}
                            </p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-gray-500 mt-6 mb-6">
                    (Kiểm tra console để xem log chi tiết)
                </p>

                <Link href="/" className="text-gray-700 hover:underline">
                    Quay về trang chủ
                </Link>
            </div>
        );
    }

    if (!isLoading && !error && !orderDetails) {
        return (
            <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                    Trạng thái thanh toán
                </h1>
                <p className="text-gray-600 mb-6">
                    Trạng thái nhận được: {status || 'Không xác định'}. Thanh toán không
                    thành công hoặc đã bị hủy.
                </p>
                <Link href="/" className="text-gray-700 hover:underline">
                    Quay về trang chủ
                </Link>
            </div>
        );
    }

    return null;
}

export default function PaymentSuccessPage() {
    return (
        <div className="container mx-auto py-12 min-h-[70vh]">
            <Suspense
                fallback={
                    <div className="text-center max-w-lg mx-auto p-8">
                        <Loader2 className="animate-spin h-12 w-12 text-gray-900 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải trang xác nhận...</p>
                    </div>
                }
            >
                <SuccessContent />
            </Suspense>
        </div>
    );
}
