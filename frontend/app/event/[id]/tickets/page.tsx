'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import {useParams} from "next/navigation";

interface TicketClass {
    id: number;
    name: string;
    price: string;
}

interface Ticket {
    id: number;
    ticketCode: string;
    status: string;
    ticketClass: TicketClass;
    purchaseDate: string;
    customerName: string;
    customerEmail: string;
    formData: Record<string, any>;
}

export default function TicketsPage() {
    const { id } = useParams();
    const eventID = id as string;
    const { token, isAdmin } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTicketForm, setSelectedTicketForm] = useState<Record<string, any> | null>(null);
    const [checkingInId, setCheckingInId] = useState<number | null>(null);

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventID}/tickets`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Không thể tải vé');
                const data = await res.json();
                setTickets(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [token]);

    const handleCheckIn = async (ticketId: number) => {
        if (!confirm('Xác nhận check-in vé này?')) return;
        setCheckingInId(ticketId);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/checkin/${ticketId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Không thể check-in');
            // update ticket locally
            setTickets(prev =>
                prev.map(t =>
                    t.id === ticketId ? { ...t, isCheckedIn: true, status: 'checked_in' } : t
                )
            );
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCheckingInId(null);
        }
    };

    if (!isAdmin) return <p className="text-center mt-10 text-red-600">Bạn không có quyền truy cập</p>;
    if (loading) return <p className="text-center mt-10">Đang tải vé...</p>;
    if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

    return (
        <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Danh sách vé</h1>
            <table className="min-w-full table-auto border border-gray-200">
                <thead className="bg-gray-100">
                <tr>
                    <th className="border px-4 py-2">Ticket Code</th>
                    <th className="border px-4 py-2">Customer Name</th>
                    <th className="border px-4 py-2">Customer Email</th>
                    <th className="border px-4 py-2">Ticket Class</th>
                    <th className="border px-4 py-2">Price</th>
                    <th className="border px-4 py-2">Purchase Date</th>
                    <th className="border px-4 py-2">Status</th>
                    <th className="border px-4 py-2">Form</th>
                    <th className="border px-4 py-2">Check in</th>
                </tr>
                </thead>
                <tbody>
                {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{ticket.ticketCode}</td>
                        <td className="border px-4 py-2">{ticket.customerName}</td>
                        <td className="border px-4 py-2">{ticket.customerEmail}</td>
                        <td className="border px-4 py-2">{ticket.ticketClass?.name}</td>
                        <td className="border px-4 py-2">{Number(ticket.ticketClass?.price).toLocaleString()}₫</td>
                        <td className="border px-4 py-2">{new Date(ticket.purchaseDate).toLocaleString()}</td>
                        <td className="border px-4 py-2 capitalize">{ticket.status}</td>
                        <td className="border px-4 py-2 text-center">
                            <button
                                onClick={() => setSelectedTicketForm(ticket.formData)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition text-sm"
                            >
                                Xem form
                            </button>
                        </td>
                        <td className="border px-4 py-2 text-center">
                            <button
                                disabled={ticket.status == "checked_in"}
                                onClick={() => handleCheckIn(ticket.id)}
                                className={`px-3 py-1 rounded text-sm ${
                                    ticket.status == "checked_in"
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-500 transition'
                                }`}
                            >
                                {ticket.status != "checked_in"
                                    ? 'Đã check-in'
                                    : checkingInId === ticket.id
                                        ? 'Đang check-in...'
                                        : 'Check-in'}
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Popup for formData */}
            {selectedTicketForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-[90%] max-w-lg max-h-[80vh] overflow-y-auto shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-center">Form Data</h2>
                        <pre className="bg-gray-100 p-4 rounded text-sm">{JSON.stringify(selectedTicketForm, null, 2)}</pre>
                        <div className="text-center mt-4">
                            <button
                                onClick={() => setSelectedTicketForm(null)}
                                className="bg-gray-300 px-5 py-2 rounded hover:bg-gray-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
