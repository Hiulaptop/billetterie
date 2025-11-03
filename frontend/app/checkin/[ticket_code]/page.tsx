'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/app/components/dialog';
import { Button } from '@/app/components/button';
import { useToast } from '@/app/components/use-toast';
import { Skeleton } from '@/app/components/skeleton';
import {
    AlertCircle,
    CheckCircle,
    TicketIcon,
    XCircle,
    User,
} from 'lucide-react';
import Link from 'next/link';

interface TicketDetails {
    id: string;
    ticketCode: string;
    status: 'paid' | 'checked_in' | 'pending_payment' | 'cancelled' | string;
    guestEmail?: string | null;
    customerName?: string | null; // tên khi mua non-logged-in
    customerEmail?: string | null; // email khi mua non-logged-in
    formAnswers: Record<string, any>;
    createdAt?: string;
    ticketClass?: {
        name: string;
        price: number;
    } | null;
    event?: {
        name?: string;
    } | null;
    user?: {
        email?: string;
        displayName?: string;
        name?: string;
        username?: string;
    } | null;
}

export default function CheckinPage() {
    const params = useParams();
    const router = useRouter();
    const { token, status: authStatus } = useAuth();
    const { toast } = useToast();
    const ticketCode = params.ticket_code as string;

    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push(`/login?callbackUrl=/checkin/${ticketCode}`);
            return;
        }

        if (authStatus === 'authenticated' && ticketCode) {
            const fetchTicket = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/checkin/${ticketCode}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );

                    if (res.status === 403) throw new Error('Bạn không có quyền xem vé này.');
                    if (res.status === 404) throw new Error('Không tìm thấy vé với mã này.');
                    if (!res.ok) throw new Error('Không thể tải thông tin vé.');

                    const data: TicketDetails = await res.json();
                    setTicket(data);
                    setIsModalOpen(true);
                } catch (err: any) {
                    const msg = err?.message || 'Có lỗi xảy ra';
                    setError(msg);
                    toast({
                        title: 'Lỗi',
                        description: msg,
                        variant: 'destructive',
                    });
                } finally {
                    setIsLoading(false);
                }
            };

            fetchTicket();
        }
    }, [authStatus, ticketCode, token, router, toast]);

    const handleCheckin = async () => {
        if (!ticket || isCheckingIn) return;

        if (ticket.status !== 'paid') {
            toast({
                title: 'Không thể check-in',
                description: 'Vé phải ở trạng thái đã thanh toán để thực hiện check-in.',
                variant: 'destructive',
            });
            return;
        }

        setIsCheckingIn(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/checkin/${ticketCode}/confirm`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Check-in thất bại');
            }

            const updatedTicket: TicketDetails = await res.json();
            setTicket(updatedTicket);

            toast({
                title: 'Thành công',
                description: 'Check-in vé thành công.',
                variant: 'default',
            });
        } catch (err: any) {
            const msg = err?.message || 'Có lỗi khi check-in';
            setError(msg);
            toast({
                title: 'Lỗi',
                description: msg,
                variant: 'destructive',
            });
        } finally {
            setIsCheckingIn(false);
        }
    };

    const StatusBadge = ({ status }: { status: TicketDetails['status'] }) => {
        switch (status) {
            case 'paid':
                return (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-blue-50 text-blue-800 font-medium text-sm">
                        <TicketIcon className="w-4 h-4" />
                        Đã thanh toán
                    </div>
                );
            case 'checked_in':
                return (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-green-50 text-green-800 font-semibold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Đã check-in
                    </div>
                );
            case 'pending_payment':
                return (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-yellow-50 text-yellow-800 font-medium text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Chưa thanh toán
                    </div>
                );
            case 'cancelled':
                return (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-red-50 text-red-800 font-medium text-sm">
                        <XCircle className="w-4 h-4" />
                        Đã huỷ
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gray-50 text-gray-700 font-medium text-sm">
                        Trạng thái: {status}
                    </div>
                );
        }
    };

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
                <div className="mt-6 grid grid-cols-1 gap-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (error && !ticket) {
        return (
            <div className="container mx-auto max-w-lg py-12 text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-red-50 p-4">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mt-4">Không thể truy xuất vé</h1>
                <p className="mt-2 text-red-600">{error}</p>
                <div className="mt-6 flex justify-center gap-3">
                    <Button asChild>
                        <Link href="/">Về trang chủ</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setError(null);
                            setIsLoading(true);
                        }}
                    >
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    const attendeeName =
        ticket?.user?.displayName ||
        ticket?.user?.name ||
        ticket?.customerName ||
        ticket?.user?.username ||
        null;

    const attendeeEmail =
        ticket?.user?.email || ticket?.customerEmail || ticket?.guestEmail || null;

    return (
        <div className="container mx-auto max-w-lg py-12">
            <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <TicketIcon className="w-8 h-8 text-primary" />
                            <div>
                                <DialogTitle className="text-xl font-semibold">Chi tiết vé</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Sự kiện: <strong>{ticket?.event?.name || 'N/A'}</strong>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {ticket ? (
                        <main className="py-4 space-y-4">
                            <section className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">{ticket.ticketClass?.name || '—'}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mã vé: <span className="font-mono">{ticket.ticketCode}</span>
                                    </p>
                                </div>
                                <div>
                                    <StatusBadge status={ticket.status} />
                                </div>
                            </section>

                            <section className="grid grid-cols-1 gap-4">
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">Người tham dự</p>
                                    <div className="mt-2 text-sm space-y-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">{attendeeName ?? <span className="italic text-xs text-muted-foreground">N/A</span>}</div>
                                                <div className="text-sm text-muted-foreground">{attendeeEmail ?? <span className="italic text-xs text-muted-foreground">N/A</span>}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground">Loại vé & Giá</p>
                                    <div className="mt-2 text-sm font-medium">{ticket.ticketClass?.name || '—'}</div>
                                    <div className="text-sm text-muted-foreground">{ticket.ticketClass?.price ? `${ticket.ticketClass.price.toLocaleString('vi-VN')}₫` : '—'}</div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold">Thông tin đăng ký</h4>
                                    <div className="mt-2 text-sm text-foreground space-y-1 pl-2 border-l-2">
                                        {ticket.formAnswers && Object.keys(ticket.formAnswers).length > 0 ? (
                                            Object.entries(ticket.formAnswers).map(([k, v]) => (
                                                <div key={k} className="flex items-start gap-2">
                                                    <div className="w-28 text-xs text-muted-foreground">{k}:</div>
                                                    <div className="break-words">{String(v)}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="italic text-sm text-muted-foreground">Không có thông tin bổ sung.</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </main>
                    ) : null}

                    <DialogFooter className="flex flex-col gap-3">
                        <div className="w-full">
                            <Button
                                className="w-full"
                                onClick={handleCheckin}
                                disabled={isCheckingIn || ticket?.status !== 'paid'}
                            >
                                {isCheckingIn ? 'Đang xử lý...' : ticket?.status === 'paid' ? 'Xác nhận Check-in' : 'Không thể Check-in'}
                            </Button>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => { setIsModalOpen(false); router.push('/'); }}>
                                Đóng
                            </Button>
                            <Button variant="ghost" className="flex-1" asChild>
                                <Link href="/orders">Xem đơn hàng</Link>
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
