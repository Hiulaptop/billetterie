// frontend/app/components/EventItem.tsx
'use client'
import Image from "next/image"; // Nên dùng Image của Next.js để tối ưu
import Link from 'next/link';

// Định nghĩa kiểu cho props `item` rõ ràng hơn
interface EventItemProps {
    item: {
        id: number;
        title: string;
        description?: string; // Có thể có hoặc không tùy vào API
        // Thêm các trường khác nếu API trả về và bạn muốn hiển thị
        // Ví dụ: location, date, priceRange...
    };
}

export default function EventItem({ item }: EventItemProps) {
    const getThumbnailUrl = (id: number) => {
        // Đảm bảo NEXT_PUBLIC_API_URL được định nghĩa trong .env.local
        return `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/thumbnail`;
    };

    return (
        <Link
            href={`/event/${item.id}`} // Link tới trang chi tiết
            className="group flex flex-col bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
        >
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden">
                {/* Sử dụng Next.js Image component */}
                <Image
                    src={getThumbnailUrl(item.id)}
                    alt={`Thumbnail for ${item.title}`}
                    layout="fill" // Hoặc fill
                    objectFit="cover" // Hoặc contain tùy thiết kế
                    className="transition-transform duration-300 group-hover:scale-105"
                    // Thêm placeholder hoặc blurDataURL nếu muốn
                    // placeholder="blur"
                    // blurDataURL="data:..."
                    unoptimized // Tạm thời tắt tối ưu nếu có lỗi với ảnh từ localhost
                />
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-grow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate group-hover:text-clip group-hover:whitespace-normal">
                    {item.title || "Untitled Event"} {/* Fallback title */}
                </h3>

                {/* Optional: Hiển thị mô tả ngắn */}
                {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}

                {/* Placeholder cho thông tin khác (Ngày, Địa điểm, Giá) */}
                <div className="mt-auto pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                    {/* Ví dụ placeholders */}
                    <div>📅 Date Placeholder</div>
                    <div>📍 Location Placeholder</div>
                    <div>💰 Price Placeholder</div>
                </div>

            </div>
        </Link>
    );
}