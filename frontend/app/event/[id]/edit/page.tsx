// frontend/app/event/[id]/edit/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import Image from "next/image";
import Link from "next/link";

// --- Types (Tương tự trang Create) ---
type TicketClassInput = {
    id?: number; // Thêm ID cho các mục đã có
    name: string;
    price: string;
    quantity?: string;
    description?: string;
    isActive?: boolean;
};

type ShowtimeInput = {
    id?: number; // Thêm ID cho các mục đã có
    start: string;
    end: string;
    location: string;
    description?: string;
    ticketClasses: TicketClassInput[];
};

type FieldOptionInput = {
    id?: number;
    value: string;
    label?: string;
};

type FormFieldInput = {
    id?: number;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    displayOrder: number;
    options: FieldOptionInput[];
};

type EventForm = {
    id: number;
    title: string;
    description: string | null;
    fields: FormFieldInput[];
};

// Hằng số cho Form Field Types
const FIELD_TYPES = [
    { value: 'short_answer', label: 'Trả lời ngắn' },
    { value: 'long_answer', label: 'Trả lời dài (Đoạn)' },
    { value: 'date', label: 'Ngày' },
    { value: 'multiple_choice', label: 'Trắc nghiệm (Chọn 1)' },
    { value: 'checkbox', label: 'Hộp kiểm (Chọn nhiều)' },
];

// Type cho dữ liệu Event chi tiết
interface EventDetail {
    id: number;
    title: string;
    description: string;
    shortkey: string | null;
    showtimes: ShowtimeInput[]; // Dùng luôn type của Input để dễ quản lý
    form: EventForm | null;
    // ... thêm các trường khác nếu API trả về
}

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const { token, isAdmin } = useAuth();
    const eventId = params.id as string;

    // --- State cho Form ---
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [shortkey, setShortkey] = useState("");
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>("");

    // State cho showtimes (sẽ được load từ API)
    const [showtimes, setShowtimes] = useState<ShowtimeInput[]>([]);

    // --- (MỚI) State cho Form (Chuyển từ edit-form) ---
    const [formId, setFormId] = useState<number | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formFields, setFormFields] = useState<FormFieldInput[]>([]);
    const [fieldsToDelete, setFieldsToDelete] = useState<number[]>([]);

    // --- State UI ---
    const [loading, setLoading] = useState(true); // Loading dữ liệu ban đầu
    const [saving, setSaving] = useState(false); // Đang lưu thay đổi
    const [error, setError] = useState<string | null>(null);

    // --- Hàm format ngày giờ (Helper) ---
    const formatDateTimeLocal = (isoString: string | Date) => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return "";

            // Chuyển sang múi giờ VN (GMT+7)
            const vnDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
            // Cắt chuỗi ISO và bỏ 'Z' (ví dụ: '2023-10-27T17:00:00.000Z' -> '2023-10-27T17:00')
            // Cần lấy 16 ký tự đầu (YYYY-MM-DDTHH:mm)
            return vnDate.toISOString().substring(0, 16);
        } catch (e) {
            return "";
        }
    };


    // --- Fetch dữ liệu sự kiện hiện có ---
    useEffect(() => {
        let ignore = false;
        if (!eventId || !isAdmin) {
            if (!isAdmin) setError("Access Denied.");
            setLoading(false);
            return;
        }

        const fetchEventData = async () => {
            setLoading(true);
            setError(null);
            try {
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`;
                const response = await fetch(apiUrl, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch event data.");
                }

                const data: EventDetail = await response.json();
                if (ignore) return;


                // Populate state
                setTitle(data.title);
                setDescription(data.description);
                setShortkey(data.shortkey || "");
                setCurrentThumbnailUrl(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/thumbnail`);

                // Chuyển đổi dữ liệu showtimes/ticketclasses về dạng string cho input
                const formattedShowtimes = Array.isArray(data.showtimes)
                    ? data.showtimes.map(st => ({
                        ...st,
                        start: formatDateTimeLocal(st.start),
                        end: formatDateTimeLocal(st.end),
                        ticketClasses: Array.isArray(st.ticketClasses)
                            ? st.ticketClasses.map(tc => ({
                                ...tc,
                                price: String(tc.price ?? ""), // tránh null
                                quantity: tc.quantity ? String(tc.quantity) : "",
                            }))
                            : [], // fallback nếu ticketClasses null
                    }))
                    : []; // fallback nếu showtimes null

                setShowtimes(formattedShowtimes);

                // 3. (MỚI) Populate state Form
                if (data.form) {
                    setFormId(data.form.id);
                    setFormTitle(data.form.title);
                    setFormDescription(data.form.description || "");
                    setFormFields(data.form.fields.sort((a, b) => a.displayOrder - b.displayOrder));
                } else {
                    console.warn("Event không có Form.");
                    // (Có thể set giá trị mặc định nếu muốn cho phép TẠO MỚI form ở đây)
                }

            } catch (err: any) {
                if (!ignore) setError(err.message);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchEventData();

        return () => { ignore = true; };
    }, [eventId, isAdmin, token]);

    // --- Xử lý Thumbnail (Giống trang Create) ---
    function onThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) {
            setThumbnailFile(null);
            setThumbnailPreview(null);
            return;
        };
        setThumbnailFile(f);
        setThumbnailPreview(URL.createObjectURL(f));
    }

    // --- Xử lý Showtimes & TicketClasses (Thêm/Sửa/Xóa) ---
    // (Giữ nguyên các hàm add/update từ trang create)
    function addShowtime() {
        setShowtimes((prev) =>
            prev.concat({ start: "", end: "", location: "", ticketClasses: [{ name: "", price: "" }] })
        );
    }
    // Cần hàm xóa showtime (logic phức tạp hơn)
    async function removeShowtime(si: number) {
        const showtimeToRemove = showtimes[si];

        // Nếu showtime này chưa có id (mới thêm ở client) -> chỉ xóa ở state
        if (!showtimeToRemove.id) {
            setShowtimes((prev) => prev.filter((_, idx) => idx !== si));
            return;
        }

        // Nếu showtime đã có id -> gọi API xóa
        if (!window.confirm(`Bạn có chắc muốn xóa Showtime này (ID: ${showtimeToRemove.id})? Toàn bộ vé của nó sẽ bị xóa.`)) return;

        try {
            // **Cần API Endpoint:** DELETE /showtimes/:id
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/showtimes/${showtimeToRemove.id}`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Xóa showtime thất bại.');
            }
            // Xóa thành công ở DB -> Xóa ở state
            setShowtimes((prev) => prev.filter((_, idx) => idx !== si));
            alert("Xóa showtime thành công.");
        } catch (err: any) {
            setError(err.message);
        }
    }

    function addTicketClass(si: number) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si].ticketClasses.push({ name: "", price: "", quantity: "", description: "", isActive: true });
            return copy;
        });
    }
    // Cần hàm xóa ticket class
    async function removeTicketClass(si: number, ti: number) {
        const ticketClassToRemove = showtimes[si].ticketClasses[ti];

        // Nếu vé chưa có id (mới thêm ở client) -> xóa ở state
        if (!ticketClassToRemove.id) {
            setShowtimes((prev) => {
                const copy = [...prev];
                copy[si].ticketClasses = copy[si].ticketClasses.filter((_, idx) => idx !== ti);
                return copy;
            });
            return;
        }

        // Nếu vé đã có id -> gọi API xóa
        if (!window.confirm(`Bạn có chắc muốn xóa Loại vé này (ID: ${ticketClassToRemove.id})?`)) return;

        try {
            // **Cần API Endpoint:** DELETE /ticket-classes/:id
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes/${ticketClassToRemove.id}`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Xóa loại vé thất bại.');
            }
            // Xóa thành công ở DB -> Xóa ở state
            setShowtimes((prev) => {
                const copy = [...prev];
                copy[si].ticketClasses = copy[si].ticketClasses.filter((_, idx) => idx !== ti);
                return copy;
            });
            alert("Xóa loại vé thành công.");
        } catch (err: any) {
            setError(err.message);
        }
    }

    function updateShowtimeField(si: number, field: keyof Omit<ShowtimeInput, 'ticketClasses'>, value: string) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si] = { ...copy[si], [field]: value };
            return copy;
        });
    }
    function updateTicketClassField(si: number, ti: number, field: keyof TicketClassInput, value: string | boolean | undefined) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si] = {
                ...copy[si],
                ticketClasses: copy[si].ticketClasses.map((tc, index) =>
                    index === ti ? { ...tc, [field]: value } : tc
                )
            };
            return copy;
        });
    }

    // Hàm cho form
    function addFormField() {
        setFormFields(prev => [
            ...prev,
            { label: `Câu hỏi mới ${prev.length + 1}`, type: 'short_answer', required: false, displayOrder: prev.length + 1, options: [] }
        ]);
    }

    function removeFormField(fi: number) {
        const fieldToRemove = formFields[fi];
        if (fieldToRemove.id) {
            setFieldsToDelete(prev => [...prev, fieldToRemove.id!]);
        }
        setFormFields(prev => prev.filter((_, idx) => idx !== fi));
    }

    function updateFormField(fi: number, field: keyof FormFieldInput, value: any) {
        setFormFields(prev => prev.map((item, idx) =>
            idx === fi ? { ...item, [field]: value } : item
        ));
        if (field === 'type' && value !== 'multiple_choice' && value !== 'checkbox') {
            setFormFields(prev => prev.map((item, idx) =>
                idx === fi ? { ...item, options: [] } : item
            ));
        }
    }

    function addFieldOption(fi: number) {
        setFormFields(prev => prev.map((item, idx) => {
            if (idx === fi) {
                return { ...item, options: [...item.options, { value: `Lựa chọn ${item.options.length + 1}` }] };
            }
            return item;
        }));
    }

    function removeFieldOption(fi: number, oi: number) {
        setFormFields(prev => prev.map((item, idx) => {
            if (idx === fi) {
                return { ...item, options: item.options.filter((_, optIdx) => optIdx !== oi) };
            }
            return item;
        }));
    }

    function updateFieldOption(fi: number, oi: number, field: keyof FieldOptionInput, value: string) {
        setFormFields(prev => prev.map((item, idx) => {
            if (idx === fi) {
                return {
                    ...item,
                    options: item.options.map((opt, optIdx) =>
                        optIdx === oi ? { ...opt, [field]: value, label: (field === 'value' ? value : opt.label) } : opt
                    )
                };
            }
            return item;
        }));
    }


    // --- Hàm Submit Chính (Cập nhật) ---
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);

        if (!isAdmin || !token || !eventId) {
            setError("Unauthorized.");
            setSaving(false);
            return;
        }

        try {
            // --- 1. (MỚI) Xóa các Fields đã bị xóa ---
            // (API: DELETE /forms/fields/:id)
            const deleteFieldPromises = fieldsToDelete.map(id =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/forms/fields/${id}`, {
                    method: 'DELETE', headers: { "Authorization": `Bearer ${token}` }
                })
            );
            await Promise.all(deleteFieldPromises);
            console.log("Deleted old fields.");
            setFieldsToDelete([]); // Xóa danh sách chờ


            // --- 2. Cập nhật thông tin Event (Title, Desc, Shortkey, Thumbnail) ---
            // (API: PUT /events/:id)
            const eventFormData = new FormData();
            eventFormData.append("title", title);
            eventFormData.append("description", description);
            eventFormData.append("shortkey", shortkey);
            if (thumbnailFile) {
                eventFormData.append("thumbnail", thumbnailFile);
            }
            const eventApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`;
            const eventResp = await fetch(eventApiUrl, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: eventFormData,
            });
            if (!eventResp.ok) {
                const err = await eventResp.json();
                throw new Error(`Event update failed: ${err.message?.join ? err.message.join(', ') : err.message}`);
            }
            console.log("Event info updated.");


            // --- 3. (MỚI) Cập nhật thông tin Form (Title, Desc) ---
            if (formId) {
                // (API: PUT /forms/:id)
                const formApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/forms/${formId}`;
                const formUpdateResp = await fetch(formApiUrl, {
                    method: 'PATCH',
                    headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: formTitle, description: formDescription })
                });
                if (!formUpdateResp.ok) {
                    const errData = await formUpdateResp.json().catch(() => ({}));
                    console.error("Form update failed:", errData);
                    throw new Error(`Cập nhật thông tin form thất bại: ${errData.message || formUpdateResp.statusText}`);
                }

                console.log("Updated form info.");
            }


            // --- 4. (GỘP) Cập nhật/Tạo mới Showtimes VÀ Form Fields ---

            // 4a. (MỚI) Chuẩn bị Promises cho Form Fields
            const fieldPromises = formFields.map(async (field, index) => {
                const fieldPayload = {
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    placeholder: field.placeholder || null,
                    displayOrder: index + 1,
                    options: field.options.map(opt => ({
                        value: opt.value,
                        label: opt.label || opt.value,
                    })),
                };

                if (field.id) {
                    // Cập nhật Field (API: PUT /forms/fields/:id)
                    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/forms/fields/${field.id}`;
                    return fetch(apiUrl, {
                        method: 'PUT',
                        headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(fieldPayload)
                    });
                } else {
                    // Tạo Field mới (API: POST /forms/:formId/fields)
                    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/forms/${formId}/fields`;
                    return fetch(apiUrl, {
                        method: 'POST',
                        headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(fieldPayload)
                    });
                }
            });


            // --- 2. Xử lý Showtimes & Ticket Classes ---
            // Phân loại: cái nào mới (chưa có id), cái nào cũ (đã có id)
            const newShowtimes = showtimes.filter(st => !st.id);
            const updatedShowtimes = showtimes.filter(st => st.id);

            // 2a. Cập nhật các showtimes đã có
            const updateSTPromises = updatedShowtimes.map(async (st) => {
                // **Cần API Endpoint:** PUT /showtimes/:id
                const stApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/showtimes/${st.id}`;
                const stPayload = {
                    start: new Date(st.start).toISOString(),
                    end: new Date(st.end).toISOString(),
                    location: st.location,
                    description: st.description,
                };
                await fetch(stApiUrl, {
                    method: 'PUT',
                    headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(stPayload)
                });
                console.log(`Showtime ${st.id} updated.`);

                // Xử lý ticket classes bên trong showtime này
                const newTCs = st.ticketClasses.filter(tc => !tc.id);
                const updatedTCs = st.ticketClasses.filter(tc => tc.id);

                // Cập nhật ticket classes đã có
                const updateTCPromises = updatedTCs.map(async (tc) => {
                    // **Cần API Endpoint:** PUT /ticket-classes/:id
                    const tcApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes/${tc.id}`;
                    const tcPayload = {
                        name: tc.name,
                        price: parseFloat(tc.price),
                        quantity: tc.quantity ? parseInt(tc.quantity, 10) : null,
                        description: tc.description,
                        isActive: tc.isActive,
                    };
                    await fetch(tcApiUrl, {
                        method: 'PUT',
                        headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(tcPayload)
                    });
                    console.log(`TicketClass ${tc.id} updated.`);
                });
                // Thêm mới ticket classes
                const createTCPromises = newTCs.map(async (tc) => {
                    // **Cần API Endpoint:** POST /ticket-classes
                    const tcApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes`;
                    const tcPayload = {
                        eventId: parseInt(eventId),
                        showtimeId: st.id, // Dùng ID của showtime cha
                        name: tc.name,
                        price: parseFloat(tc.price),
                        quantity: tc.quantity ? parseInt(tc.quantity, 10) : null,
                        description: tc.description,
                        isActive: tc.isActive ?? true,
                    };
                    await fetch(tcApiUrl, {
                        method: 'POST',
                        headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(tcPayload)
                    });
                    console.log(`New TicketClass created for Showtime ${st.id}.`);
                });

                await Promise.all([...updateTCPromises, ...createTCPromises]);
            });

            // 2b. Thêm các showtimes mới
            const createSTPromises = newShowtimes.map(async (st) => {
                // **Cần API Endpoint:** POST /showtimes (Logic giống trang Create)
                const stApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/showtimes`;
                const stPayload = {
                    eventId: parseInt(eventId),
                    start: new Date(st.start).toISOString(),
                    end: new Date(st.end).toISOString(),
                    location: st.location,
                    description: st.description,
                };
                const stResp = await fetch(stApiUrl, {
                    method: 'POST',
                    headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(stPayload)
                });
                const newShowtimeData = await stResp.json();
                const newShowtimeId = newShowtimeData.id;
                console.log(`New Showtime ${newShowtimeId} created.`);

                // Thêm các ticket classes cho showtime MỚI này
                const createTCPromises = st.ticketClasses.map(async (tc) => {
                    const tcApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes`;
                    const tcPayload = {
                        eventId: parseInt(eventId),
                        showtimeId: newShowtimeId,
                        name: tc.name,
                        price: parseFloat(tc.price),
                        quantity: tc.quantity ? parseInt(tc.quantity, 10) : null,
                        description: tc.description,
                        isActive: tc.isActive ?? true,
                    };
                    await fetch(tcApiUrl, {
                        method: 'POST',
                        headers: { "Authorization": `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(tcPayload)
                    });
                });
                await Promise.all(createTCPromises);
                console.log(`New TicketClasses created for new Showtime ${newShowtimeId}.`);
            });

            // Chờ tất cả các promise cập nhật/tạo mới hoàn tất
            await Promise.all([...updateSTPromises, ...createSTPromises]);

            alert("Cập nhật sự kiện thành công!");
            router.push(`/event/${eventId}`); // Quay về trang chi tiết

        } catch (err: any) {
            console.error("Error updating event:", err);
            setError(`Update failed: ${err.message}`);
        } finally {
            setSaving(false);
        }
    }


    // --- Giao diện JSX ---
    if (loading) {
        return <p className="text-center text-gray-500">Loading event data...</p>;
    }

    if (!isAdmin) {
        return <p className="text-center text-red-600">Access Denied. Only Admins can edit events.</p>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-6 pb-4 flex justify-between items-center border-b">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Edit Event</h1>
                        <p className="text-sm text-gray-500 mt-1">{title}</p>
                    </div>
                    <Link href={`/event/${eventId}`} className="text-sm text-gray-600 hover:text-gray-900">
                        &larr; Back to Event
                    </Link>
                </header>


                <form onSubmit={onSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-lg shadow-md">
                    {/* --- Event Details --- */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Event Information</h2>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2" />
                        </div>
                        <div>
                            <label htmlFor="shortkey" className="block text-sm font-medium text-gray-700">Short Key <span className="text-red-500">*</span></label>
                            <input id="shortkey" value={shortkey} onChange={(e) => setShortkey(e.target.value.toUpperCase())} required pattern="[A-Z0-9]{3,10}" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 uppercase" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 min-h-[100px]" />
                        </div>
                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Thumbnail Image</label>
                            <p className="text-xs text-gray-500 mb-2">Upload a new image to replace the current one.</p>
                            <div className="flex gap-4 items-center">
                                {currentThumbnailUrl && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-1">Current:</p>
                                        <Image src={currentThumbnailUrl} alt="Current Thumbnail" width={128} height={128} className="h-32 w-auto object-contain rounded border bg-gray-100" unoptimized />
                                    </div>
                                )}
                                {thumbnailPreview && (
                                    <div>
                                        <p className="text-xs font-medium text-green-600 mb-1">New:</p>
                                        <img src={thumbnailPreview} alt="New Thumbnail Preview" className="h-32 w-auto object-contain rounded border border-green-400"/>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" onChange={onThumbnailChange} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"/>
                        </div>
                    </section>

                    {/* --- 2. (MỚI) Form Builder (Chuyển từ edit-form) --- */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-xl font-semibold text-gray-700">2. Form đăng ký</h2>
                            <button
                                type="button"
                                onClick={addFormField}
                                className="text-sm bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-600"
                            >
                                + Thêm trường
                            </button>
                        </div>

                        {/* Form Title & Desc */}
                        <div>
                            <label htmlFor="formTitle" className="block text-sm font-medium text-gray-700">Tiêu đề Form</label>
                            <input
                                id="formTitle"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)} // Đã sửa lỗi "e.targe"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">Mô tả Form</label>
                            <textarea
                                id="formDescription"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 min-h-[60px] focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                                placeholder="Hướng dẫn hoặc mô tả thêm về form..."
                            />
                        </div>

                        {/* Form Fields List */}
                        <div className="space-y-4">
                            {formFields.map((field, fi) => (
                                <div key={field.id || `new-${fi}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">

                                    {/* Field Label, Type, Required, Remove */}
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full md:w-auto">
                                            <input
                                                type="text"
                                                placeholder="Tên trường (ví dụ: Họ tên)"
                                                value={field.label}
                                                onChange={(e) => updateFormField(fi, 'label', e.target.value)}
                                                required
                                                className="p-2 w-full rounded border border-gray-300 text-sm"
                                            />
                                            <select
                                                value={field.type}
                                                onChange={(e) => updateFormField(fi, 'type', e.target.value)}
                                                className="p-2 w-full rounded border border-gray-300 text-sm bg-white"
                                            >
                                                {FIELD_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-3 pt-2">
                                            {field.id && <span className="text-xs text-gray-400">(ID: {field.id})</span>}
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => updateFormField(fi, 'required', e.target.checked)}
                                                    className="rounded text-gray-600 focus:ring-gray-500 h-4 w-4"
                                                />
                                                <span className="text-xs text-gray-600">Bắt buộc</span>
                                            </label>
                                            <button
                                                type="button" // Đã sửa lỗi "typeF"
                                                onClick={() => removeFormField(fi)}
                                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>

                                    {/* Placeholder Input */}
                                    {(field.type === 'short_answer' || field.type === 'long_answer') && (
                                        <input
                                            type="text"
                                            placeholder="Văn bản gợi ý (Placeholder)"
                                            value={field.placeholder || ''}
                                            onChange={(e) => updateFormField(fi, 'placeholder', e.target.value)}
                                            className="p-2 w-full rounded border border-gray-200 text-sm"
                                        />
                                    )}

                                    {/* Options Builder (cho trắc nghiệm/checkbox) */}
                                    {(field.type === 'multiple_choice' || field.type === 'checkbox') && (
                                        <div className="pl-4 border-l-2 border-gray-300 space-y-2">
                                            <p className="text-xs font-medium text-gray-600">Các lựa chọn:</p>
                                            {field.options.map((opt, oi) => (
                                                <div key={opt.id || `new-${oi}`} className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">
                                    {field.type === 'multiple_choice' ? '○' : '□'}
                                </span>
                                                    <input
                                                        type="text"
                                                        placeholder={`Lựa chọn ${oi + 1}`}
                                                        value={opt.value}
                                                        onChange={(e) => updateFieldOption(fi, oi, 'value', e.target.value)}
                                                        className="p-1.5 flex-grow rounded border border-gray-200 text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFieldOption(fi, oi)}
                                                        className="text-xs text-gray-500 hover:text-red-600 p-1"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addFieldOption(fi)}
                                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                                            >
                                                + Thêm lựa chọn
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {formFields.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Chưa có trường nào. Bấm "+ Thêm trường" để bắt đầu.</p>}
                        </div>
                    </section>

                    {/* --- Showtimes & Tickets --- */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-xl font-semibold text-gray-700">Manage Showtimes & Tickets</h2>
                            <button type="button" onClick={addShowtime} className="text-sm bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-600">+ Add Showtime</button>
                        </div>

                        {showtimes.map((s, si) => (
                            <div key={s.id || `new-${si}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-base font-medium text-gray-800">
                                        Showtime #{si + 1} {s.id ? `(ID: ${s.id})` : "(New)"}
                                    </p>
                                    <button type="button" onClick={() => removeShowtime(si)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Remove Showtime</button>
                                </div>

                                {/* Showtime Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input type="datetime-local" value={s.start} onChange={(e) => updateShowtimeField(si, "start", e.target.value)} required className="p-2 w-full rounded border border-gray-300 text-sm" />
                                    <input type="datetime-local" value={s.end} onChange={(e) => updateShowtimeField(si, "end", e.target.value)} required className="p-2 w-full rounded border border-gray-300 text-sm" />
                                    <input type="text" placeholder="Location *" value={s.location} onChange={(e) => updateShowtimeField(si, "location", e.target.value)} required className="p-2 w-full rounded border border-gray-300 text-sm" />
                                    <input type="text" placeholder="Description (opt)" value={s.description || ""} onChange={(e) => updateShowtimeField(si, "description", e.target.value)} className="md:col-span-3 p-2 w-full rounded border border-gray-300 text-sm" />
                                </div>

                                {/* Ticket Classes for this Showtime */}
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-gray-700">Ticket Classes</h3>
                                        <button type="button" onClick={() => addTicketClass(si)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">+ Add Ticket</button>
                                    </div>
                                    <div className="space-y-2">
                                        {s.ticketClasses.map((tc, ti) => (
                                            <div key={tc.id || `new-${ti}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm">
                                                <input className="md:col-span-3 p-2 border rounded border-gray-300" placeholder="Name *" value={tc.name} onChange={(e) => updateTicketClassField(si, ti, "name", e.target.value)} required />
                                                <input className="md:col-span-2 p-2 border rounded border-gray-300" placeholder="Price *" type="number" step="0.01" min="0" value={tc.price} onChange={(e) => updateTicketClassField(si, ti, "price", e.target.value)} required />
                                                <input className="md:col-span-2 p-2 border rounded border-gray-300" placeholder="Quantity (opt)" type="number" min="1" value={tc.quantity ?? ""} onChange={(e) => updateTicketClassField(si, ti, "quantity", e.target.value)} />
                                                <input className="md:col-span-3 p-2 border rounded border-gray-300" placeholder="Description (opt)" value={tc.description ?? ""} onChange={(e) => updateTicketClassField(si, ti, "description", e.target.value)} />
                                                <div className="md:col-span-2 flex items-center justify-end gap-2">
                                                    {tc.id && <span className="text-xs text-gray-500">(ID: {tc.id})</span>}
                                                    <button type="button" onClick={() => removeTicketClass(si, ti)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                        {s.ticketClasses.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No ticket classes added.</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {showtimes.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No showtimes added yet.</p>}
                    </section>

                    {/* --- Submit Button & Error Message --- */}
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

                    <div className="flex items-center justify-end pt-4 border-t">
                        <Link href={`/event/${eventId}`} className="text-sm text-gray-600 hover:text-gray-900 mr-4">
                            Cancel
                        </Link>
                        <button type="submit" disabled={saving || !isAdmin} className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}