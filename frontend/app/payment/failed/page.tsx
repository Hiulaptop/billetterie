'use client'; // Đánh dấu đây là Client Component

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type RestoreStatus = 'idle' | 'loading' | 'success' | 'error' | 'no-code';

/**
 * Component nội dung trang, cần dùng useSearchParams
 */
function PaymentFailedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Lấy orderCode từ URL params
    const orderCodeParam = searchParams.get('orderCode');
    const orderCode = orderCodeParam ? Number(orderCodeParam) : null;

    const [status, setStatus] = useState<RestoreStatus>(orderCode ? 'idle' : 'no-code');
    const [message, setMessage] = useState<string | null>(null);

    // Lấy URL API từ biến môi trường
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    // Hàm gọi API để huỷ đơn hàng đang chờ
    const callRestore = async () => {
        if (!orderCode) {
            setStatus('no-code');
            setMessage('Không tìm thấy mã đơn hàng.');
            return;
        }

        setStatus('loading');
        setMessage(null);

        try {
            // Gửi yêu cầu POST đến API
            const res = await fetch(`${apiBase}/orders/cancel-pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderCode }),
            });

            // Xử lý nếu API trả về lỗi (res.ok === false)
            if (!res.ok) {
                let errMsg = 'Không thể hoàn vé. Vui lòng thử lại sau.';
                try {
                    // Cố gắng đọc nội dung lỗi từ API
                    const data = await res.json();
                    errMsg = data?.message || data?.error || errMsg;
                } catch {}
                throw new Error(errMsg);
            }

            // Xử lý khi API thành công
            const data = await res.json().catch(() => ({})); // Bắt lỗi nếu body rỗng
            setStatus('success');
            setMessage(data?.message || `Đã hoàn lại vé cho đơn ${orderCode}.`);
        } catch (err: any) {
            // Xử lý lỗi (fetch thất bại hoặc throw new Error)
            setStatus('error');
            setMessage(err?.message || 'Có lỗi khi hoàn vé. Vui lòng thử lại.');
        }
    };

    // Tự động gọi hàm callRestore khi component được tải
    // và có orderCode
    useEffect(() => {
        if (orderCode) callRestore();
    }, [orderCode]); // Chỉ chạy khi orderCode thay đổi

    // Giao diện
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8 text-center">
                {/* Icon lỗi */}
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
                    />
                </svg>

                <h1 className="text-2xl font-semibold text-red-700 mb-2">
                    Thanh toán Thất bại hoặc Bị huỷ
                </h1>

                <p className="text-gray-600 mb-4">
                    Thanh toán của bạn không thể xử lý hoặc đã bị huỷ.
                    {orderCode && ` (Mã đơn hàng: ${orderCode})`}
                </p>

                {/* Hiển thị trạng thái xử lý hoàn vé */}
                {status === 'loading' && <p className="text-gray-700 mb-2">Đang xử lý hoàn vé...</p>}
                {status === 'success' && <p className="text-green-700 mb-2">{message}</p>}
                {status === 'error' && <p className="text-red-600 mb-2">{message}</p>}
                {status === 'no-code' && <p className="text-yellow-700 mb-2">{message}</p>}

                {/* Các nút hành động */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <Link
                        href="/"
                        className="inline-block px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Về trang chủ
                    </Link>
                    <button
                        onClick={callRestore}
                        disabled={!orderCode || status === 'loading' || status === 'success'}
                        className="inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                        {status === 'loading' ? 'Đang xử lý...' : 'Thử hoàn vé lại'}
                    </button>
                    <button
                        onClick={() => router.push('/')} // Giả sử quay về trang chủ để thử lại
                        className="inline-block px-4 py-2 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Thử thanh toán lại
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Component Fallback (giao diện dự phòng)
 * Sẽ hiển thị trong khi <PaymentFailedContent> đang chờ.
 */
function PaymentFailedLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8 text-center">
                {/* Icon loading quay vòng */}
                <svg
                    className="w-16 h-16 text-gray-400 animate-spin mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <h1 className="text-2xl font-semibold text-gray-700 mb-2">
                    Đang tải trang...
                </h1>
                <p className="text-gray-600 mb-4">
                    Vui lòng đợi trong khi chúng tôi kiểm tra thông tin thanh toán của bạn.
                </p>
            </div>
        </div>
    );
}


/**
 * Đây là trang chính (Client Component).
 * Vì nó là Client Component, nó có thể bọc component con
 * (cũng là client component) trong <Suspense>
 */
export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<PaymentFailedLoading />}>
            <PaymentFailedContent />
        </Suspense>
    );
}

