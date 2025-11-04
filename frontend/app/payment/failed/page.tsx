// frontend/app/payment/failed/page.tsx
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailedPage() {
    const searchParams = useSearchParams();
    const orderCode = searchParams.get('orderCode');
    // PayOS có thể trả về lý do hủy/lỗi qua params khác, bạn có thể lấy nếu cần
    // const reason = searchParams.get('reason');

    return (
        <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h1 className="text-2xl font-semibold text-red-700 mb-2">Payment Failed or Cancelled</h1>
            <p className="text-gray-600 mb-6">
                Your payment could not be processed or was cancelled.
                {orderCode && ` (Order Code: ${orderCode})`}
            </p>
            {/* {reason && <p className="text-sm text-gray-500 mb-6">Reason: {reason}</p>} */}
            <div className="space-x-4">
                <Link href="/" className="text-gray-700 hover:underline">
                    Return to Homepage
                </Link>
                {/* Optionally link back to the event page - needs eventId */}
                {/* <Link href={`/event/${eventId}`} className="text-blue-600 hover:underline">
                     Try Again
                 </Link> */}
            </div>
        </div>
    );
}