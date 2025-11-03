// frontend/app/payment/failed/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type RestoreStatus = 'idle' | 'loading' | 'success' | 'error' | 'no-code';

export default function PaymentFailedPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderCodeParam = searchParams.get('orderCode');
    const orderCode = orderCodeParam ? Number(orderCodeParam) : null;

    const [status, setStatus] = useState<RestoreStatus>(orderCode ? 'idle' : 'no-code');
    const [message, setMessage] = useState<string | null>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    const callRestore = async () => {
        if (!orderCode) {
            setStatus('no-code');
            setMessage('Không tìm thấy mã đơn hàng (orderCode).');
            return;
        }

        setStatus('loading');
        setMessage(null);

        try {
            const res = await fetch(`${apiBase}/orders/cancel-pending`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderCode }),
            });

            if (!res.ok) {
                // try read error message
                let errMsg = 'Không thể hoàn vé. Vui lòng thử lại sau.';
                try {
                    const data = await res.json();
                    errMsg = data?.message || data?.error || errMsg;
                } catch (e) {
                    // ignore JSON parse error
                }
                throw new Error(errMsg);
            }

            const data = await res.json().catch(() => ({}));
            setStatus('success');
            setMessage(data?.message || `Đã hoàn lại vé cho đơn ${orderCode}.`);
        } catch (err: any) {
            setStatus('error');
            setMessage(err?.message || 'Có lỗi khi hoàn vé. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        // Tự gọi khi có orderCode
        if (orderCode) {
            callRestore();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8 text-center">
                <svg
                    className="w-16 h-16 text-red-500 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>

                <h1 className="text-2xl font-semibold text-red-700 mb-2">Thanh toán không thành công</h1>

                <p className="text-gray-600 mb-4">
                    Thanh toán của bạn không thể xử lý hoặc đã bị huỷ.
                    {orderCode && <span> (Mã đơn: <span className="font-mono">{orderCode}</span>)</span>}
                </p>

                <div className="mb-4">
                    {status === 'loading' && (
                        <p className="text-sm text-gray-700">Đang hoàn vé... Vui lòng chờ trong giây lát.</p>
                    )}
                    {status === 'success' && (
                        <p className="text-sm text-green-700">{message ?? 'Đã hoàn vé thành công.'}</p>
                    )}
                    {status === 'error' && (
                        <p className="text-sm text-red-600">{message ?? 'Có lỗi khi hoàn vé.'}</p>
                    )}
                    {status === 'no-code' && (
                        <p className="text-sm text-yellow-700">Không tìm thấy mã đơn hàng để hoàn vé.</p>
                    )}
                    {status === 'idle' && (
                        <p className="text-sm text-gray-700">Sẵn sàng hoàn vé. Hệ thống sẽ tự xử lý.</p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-block px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Về trang chủ
                    </Link>

                    <button
                        onClick={() => {
                            if (status === 'loading') return;
                            callRestore();
                        }}
                        className="inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                        disabled={status === 'loading' || status === 'success'}
                    >
                        {status === 'loading' ? 'Đang xử lý...' : status === 'success' ? 'Đã hoàn vé' : 'Thử hoàn lại vé'}
                    </button>

                    <button
                        onClick={() => {
                            // quay về trang event (nếu có eventId, bạn có thể bổ sung param)
                            router.push('/');
                        }}
                        className="inline-block px-4 py-2 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Thử lại mua vé
                    </button>
                </div>

                <div className="mt-6 text-xs text-gray-400">
                    <p>Nếu hệ thống không tự hoàn vé, liên hệ quản trị viên để trợ giúp.</p>
                </div>
            </div>
        </div>
    );
}
