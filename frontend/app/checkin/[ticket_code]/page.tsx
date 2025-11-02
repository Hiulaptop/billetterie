'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider'; // Sử dụng hook của bạn
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/app/components/dialog';
import { Button } from '@/app/components/button';
import { useToast } from '@/app/components/use-toast'; // Import useToast
import { Skeleton } from '@/app/components/skeleton';
import { AlertCircle, CheckCircle, TicketIcon } from 'lucide-react';
import Link from "next/link";

// Định nghĩa kiểu dữ liệu Ticket (chi tiết)
interface TicketDetails {
    id: string;
    ticketCode: string;
    status: string;
    guestEmail: string | null;
    formAnswers: Record<string, any>;
    createdAt: string;
    ticketClass: {
        name: string;
        price: number;
    };
    showtime: {
        startTime: string;
        endTime: string;
    };
    event: {
        name: string;
    };
    user: {
        email: string;
    } | null;
}

export default function CheckinPage() {
    const params = useParams();
    const router = useRouter();
    // const { data: session, status: authStatus } = useSession(); // Thay thế
    const { token, status: authStatus } = useAuth(); // Sử dụng hook của bạn
    const { toast } = useToast(); // Khởi tạo toast
    const ticketCode = params.ticket_code as string;

    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    useEffect(() => {
        // 1. Xử lý xác thực
        if (authStatus === 'unauthenticated') {
            router.push(`/login?callbackUrl=/checkin/${ticketCode}`);
            return;
        }

        if (authStatus === 'authenticated' && ticketCode) {
            // 2. Fetch dữ liệu vé
            const fetchTicket = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch(
                        // Sử dụng API_URL cho nhất quán
                        `${process.env.NEXT_PUBLIC_API_URL}/checkin/${ticketCode}`,
                        {
                            headers: {
                                // Authorization: `Bearer ${session.accessToken}`, // Thay thế
                                Authorization: `Bearer ${token}`, // Sử dụng token từ useAuth
                            },
                        },
                    );


                    if (res.status === 403) {
                        throw new Error('Bạn không có quyền check-in vé này.');
                    }
                    if (res.status === 404) {
                        throw new Error('Không tìm thấy vé.');
                    }
                    if (!res.ok) {
                        throw new Error('Không thể tải thông tin vé.');
                    }
                    const data: TicketDetails = await res.json();
                    setTicket(data);
                    setIsModalOpen(true);
                } catch (err) {
                    setError((err as Error).message);
                    toast({
                        title: 'Lỗi',
                        description: (err as Error).message,
                        variant: 'destructive',
                    });
                } finally {
                    setIsLoading(false);
                }
            };

            fetchTicket();
        }
        // }, [authStatus, ticketCode, session, router]); // Thay thế
    }, [authStatus, ticketCode, token, router, toast]); // Cập nhật dependencies

    const handleCheckin = async () => {
        if (!ticket || isCheckingIn) return;

        setIsCheckingIn(true);
        try {
            const res = await fetch(
                // Sử dụng API_URL cho nhất quán
                `${process.env.NEXT_PUBLIC_API_URL}/checkin/${ticketCode}/confirm`,
                {
                    method: 'POST',
                    headers: {
                        // Authorization: `Bearer ${session.accessToken}`, // Thay thế
                        Authorization: `Bearer ${token}`, // Sử dụng token từ useAuth
                    },
                },
            );
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Check-in thất bại');
            }
            const updatedTicket: TicketDetails = await res.json();
            setTicket(updatedTicket);
            toast({
                title: 'Thành công!',
                description: 'Check-in vé thành công.',
                className: 'bg-green-100 text-green-800',
                variant: "default",
            });
        } catch (err) {
            setError((err as Error).message);
            toast({
                title: 'Lỗi',
                description: (err as Error).message,
                variant: 'destructive',
            });
        } finally {
            setIsCheckingIn(false);
        }
    };

    const getStatusComponent = () => {
        if (!ticket) return null;
        switch (ticket.status) {
            case 'paid':
                return (
                    <Button
                        className="w-full" // Xóa class màu custom để dùng variant 'default'
                        onClick={handleCheckin}
                        disabled={isCheckingIn}
                    >
                        {isCheckingIn ? 'Đang xử lý...' : 'Xác nhận Check-in'}
                    </Button>
                );
            case 'checked_in':
                return (
                    <div className="flex items-center justify-center p-3 rounded-md bg-green-100 text-green-700 font-semibold">
                        <CheckCircle className="mr-2" />
                        Đã Check-in
                    </div>
                );
            case 'pending_payment':
                return (
                    <div className="flex items-center justify-center p-3 rounded-md bg-yellow-100 text-yellow-700 font-semibold">
                        <AlertCircle className="mr-2" />
                        Vé chưa thanh toán
                    </div>
                );
            case 'cancelled':
                return (
                    <div className="flex items-center justify-center p-3 rounded-md bg-red-100 text-red-700 font-semibold">
                        <AlertCircle className="mr-2" />
                        Vé đã bị huỷ
                    </div>
                );
            default:
                return null;
        }
    };

    // Cải tiến UX: Đóng modal thì quay về trang chủ
    const handleModalClose = (open: boolean) => {
        if (!open) {
            setIsModalOpen(false);
            router.push('/');
        }
    };

    if (isLoading || authStatus === 'loading') {
        return (
            <div className="container mx-auto max-w-lg py-12">
                <Skeleton className="h-12 w-1/2 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-96 w-full mt-6" />
            </div>
        );
    }

    if (error && !ticket) {
        return (
            <div className="container mx-auto max-w-lg py-12 text-center text-red-600">
                <AlertCircle className="mx-auto h-12 w-12" />
                <h1 className="text-2xl font-bold mt-4">Đã xảy ra lỗi</h1>
                <p>{error}</p>
                <Button asChild className="mt-4">
                    <Link href="/">Về trang chủ</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-lg py-12">
            {/* Cập nhật onOpenChange */}
            <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-2xl">
                            <TicketIcon className="mr-3 h-8 w-8 text-primary" />
                            Chi tiết vé
                        </DialogTitle>
                        <DialogDescription>
                            Sự kiện: <strong>{ticket?.event.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    {ticket && (
                        <div className="space-y-4 py-4">
                            <div>
                                <h4 className="font-semibold">{ticket.ticketClass.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    Mã vé: {ticket.ticketCode}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Người tham dự</h4>
                                <p className="text-sm text-muted-foreground">
                                    {ticket.user?.email || ticket.guestEmail || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Thông tin đăng ký</h4>
                                <div className="text-sm text-foreground space-y-1 mt-1 pl-2 border-l-2">
                                    {ticket?.formAnswers && Object.keys(ticket.formAnswers).length > 0 ? (
                                        Object.entries(ticket.formAnswers).map(([key, value]) => (
                                            <p key={key}>
                                                <strong>{key}:</strong> {String(value)}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="italic">Không có thông tin bổ sung.</p>
                                    )}

                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {getStatusComponent()}
                        <button
                            onClick={handleCheckin}
                            // disabled={isCheckingIn || ticket?.status === 'PAID'}
                            className="w-full"
                        >
                            {isCheckingIn ? 'Đang xử lý...' : 'Check-in'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
