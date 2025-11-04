// frontend/app/payment/result/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

type PaymentStatus = 'success' | 'failed' | 'processing';

function PaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderCodeParam = searchParams.get('orderCode');
    const statusParam = searchParams.get('status'); // "success" | "failed"
    const codeParam = searchParams.get('code'); // PayOS code

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    const orderCode = orderCodeParam ? Number(orderCodeParam) : null;

    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
        statusParam === 'success' && codeParam === '00' ? 'success' : statusParam === 'failed' ? 'failed' : 'processing'
    );
    const [isLoading, setIsLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const isProcessing = paymentStatus === 'processing';

    const callRestore = async () => {
        if (!orderCode) {
            setMessage('Không tìm thấy mã đơn hàng.');
            return;
        }

        setPaymentStatus('processing');
        setMessage(null);

        try {
            const res = await fetch(`${backendUrl}/orders/cancel-pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderCode }),
            });

            if (!res.ok) {
                let errMsg = 'Không thể hoàn vé. Vui lòng thử lại sau.';
                try {
                    const data = await res.json();
                    errMsg = data?.message || data?.error || errMsg;
                } catch {}
                throw new Error(errMsg);
            }

            const data = await res.json().catch(() => ({}));
            setMessage(data?.message || `Đã hoàn lại vé cho đơn ${orderCode}.`);
            setPaymentStatus('failed'); // Mark as failed but restored
        } catch (err: any) {
            setMessage(err?.message || 'Có lỗi khi hoàn vé.');
        }
    };

    useEffect(() => {
        const confirmPayment = async () => {
            if (!orderCode || paymentStatus === 'failed') {
                setIsLoading(false);
                return;
            }

            try {
                if (paymentStatus === 'success') {
                    const hookRes = await fetch(`${backendUrl}/orders/payos-hook`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderCode, status: statusParam, code: codeParam }),
                    });

                    // fetch confirmation details
                    const confRes = await fetch(`${backendUrl}/orders/confirmation/${orderCode}`);
                    const data = await confRes.json();

                    if (!confRes.ok) {
                        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Không thể lấy thông tin đơn hàng');
                    }

                    setOrderDetails(data);
                }
            } catch (err: any) {
                console.error(err);
                setMessage(`Lỗi xử lý thanh toán: ${err.message}`);
                setPaymentStatus('failed');
            } finally {
                setIsLoading(false);
            }
        };

        confirmPayment();
    }, [orderCode, paymentStatus]);

    if (isLoading) {
        return (
            <div className="text-center max-w-lg mx-auto p-8">
                <Loader2 className="animate-spin h-12 w-12 text-gray-900 mx-auto mb-4" />
                <p className="text-gray-600">Đang xử lý thanh toán...</p>
                <Skeleton className="h-8 w-3/4 mx-auto mt-6" />
                <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-red-700 mb-2">Payment Failed or Cancelled</h1>
                <p className="text-gray-600 mb-4">
                    Your payment could not be processed or was cancelled.
                    {orderCode && ` (Order Code: ${orderCode})`}
                </p>
                {message && <p className="text-sm text-red-600 mb-4">{message}</p>}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <Link href="/" className="inline-block px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
                        Return to Homepage
                    </Link>
                    <button
                        onClick={callRestore}
                        disabled={!orderCode || isProcessing}
                        className="inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                        {isProcessing ? 'Processing...' : 'Try Restore Ticket'}
                    </button>
                </div>
            </div>
        );
    }

    if (orderDetails) {
        return (
            <div className="text-center max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-4">
                    You purchased tickets for <strong>{orderDetails.eventTitle}</strong>.
                </p>

                <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
                    <p className="text-sm text-gray-700">
                        <strong>Order Code:</strong> {orderDetails.orderId}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {orderDetails.tickets.map(ticket => (
                        <div key={ticket.ticketCode} className="border rounded-lg p-4 flex flex-col items-center space-y-3 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{ticket.ticketClass}</h3>
                            <QRCodeCanvas value={`${frontendUrl}/checkin/${ticket.ticketCode}`} size={180} level="H" />
                            <p className="font-mono bg-gray-200 px-2 py-1 rounded text-sm text-gray-900">{ticket.ticketCode}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-gray-500 mt-6 mb-6">(Check console for detailed logs)</p>
                <Link href="/" className="text-gray-700 hover:underline">Return to Homepage</Link>
            </div>
        );
    }

    return null;
}

export default function PaymentResultPage() {
    return (
        <div className="container mx-auto py-12 min-h-[70vh]">
            <Suspense
                fallback={
                    <div className="text-center max-w-lg mx-auto p-8">
                        <Loader2 className="animate-spin h-12 w-12 text-gray-900 mx-auto mb-4" />
                        <p className="text-gray-600">Loading payment result...</p>
                    </div>
                }
            >
                <PaymentContent />
            </Suspense>
        </div>
    );
}
