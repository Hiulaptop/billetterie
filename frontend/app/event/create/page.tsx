// frontend/app/event/create/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider"; // Import useAuth

// (Giữ nguyên các type TicketClassInput, ShowtimeInput)
type TicketClassInput = {
    name: string;
    price: string; // Giữ là string để dễ nhập liệu
    quantity?: string; // Giữ là string
    description?: string; // Thêm description
    isActive?: boolean;
};

type ShowtimeInput = {
    start: string;
    end: string;
    location: string;
    description?: string; // Thêm description
    ticketClasses: TicketClassInput[]; // Sửa tên thành ticketClasses
};

// Kiểu dữ liệu lỗi trả về từ backend
interface BackendError {
    message: string[] | string;
    error?: string;
    statusCode: number;
}

// (MỚI) Types cho Form
type FieldOptionInput = {
    value: string;
    label?: string;
};

type FormFieldInput = {
    label: string;
    type: string; // e.g., 'short_answer', 'long_answer', 'multiple_choice', 'checkbox', 'date'
    required: boolean;
    placeholder?: string;
    displayOrder: number;
    options: FieldOptionInput[]; // Chỉ dùng cho 'multiple_choice' và 'checkbox'
};

// (MỚI) Hằng số các loại trường
const FIELD_TYPES = [
    { value: 'short_answer', label: 'Trả lời ngắn' },
    { value: 'long_answer', label: 'Trả lời dài (Đoạn)' },
    { value: 'date', label: 'Ngày' },
    { value: 'multiple_choice', label: 'Trắc nghiệm (Chọn 1)' },
    { value: 'checkbox', label: 'Hộp kiểm (Chọn nhiều)' },
    // Bạn có thể thêm các loại khác (email, phone) nếu backend hỗ trợ validation
];


export default function CreateEventPage() {
    const router = useRouter();
    const { token, isAdmin } = useAuth(); // Lấy token và isAdmin

    // --- State cho Event ---
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [shortkey, setShortkey] = useState(""); // Thêm shortkey
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    // Bỏ imageFiles và imagePreviews nếu backend chưa hỗ trợ
    // const [imageFiles, setImageFiles] = useState<File[]>([]);
    // const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // --- State cho Form (nếu tạo cùng lúc) ---
    // (Thêm state cho Form, FormField, FieldOption nếu bạn muốn tạo form cùng event)
    // Ví dụ:
    // const [formTitle, setFormTitle] = useState("");
    // const [formFields, setFormFields] = useState<any[]>([]); // Định nghĩa kiểu chi tiết hơn

    // --- State cho Showtimes & TicketClasses ---
    const [showtimes, setShowtimes] = useState<ShowtimeInput[]>([
        { start: "", end: "", location: "", ticketClasses: [{ name: "", price: "", quantity: "" }] },
    ]);

    // --- (MỚI) State cho Form ---
    const [formTitle, setFormTitle] = useState("Thông tin người tham dự"); // Tiêu đề mặc định
    const [formDescription, setFormDescription] = useState(""); // Mô tả mặc định
    const [formFields, setFormFields] = useState<FormFieldInput[]>([]);

    // --- State UI ---
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Xử lý Thumbnail ---
    function onThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) {
            setThumbnailFile(null);
            setThumbnailPreview(null);
            return;
        };
        // Kiểm tra loại file cơ bản
        if (!f.type.startsWith('image/')) {
            setError('Thumbnail must be an image file.');
            setThumbnailFile(null);
            setThumbnailPreview(null);
            return;
        }
        setError(null); // Xóa lỗi nếu file hợp lệ
        setThumbnailFile(f);
        setThumbnailPreview(URL.createObjectURL(f));
    }

    // --- Xử lý Showtimes & TicketClasses (Giữ nguyên các hàm add/remove/update) ---
    function addShowtime() {
        setShowtimes((prev) =>
            prev.concat({ start: "", end: "", location: "", ticketClasses: [{ name: "", price: "" }] })
        );
    }

    function removeShowtime(si: number) {
        setShowtimes((prev) => prev.filter((_, idx) => idx !== si));
    }

    function addTicketClass(si: number) {
        setShowtimes((prev) => {
            const copy = [...prev];
            // Thêm đủ các trường cần thiết, kể cả optional
            copy[si].ticketClasses.push({ name: "", price: "", quantity: "", description: "", isActive: true });
            return copy;
        });
    }

    function removeTicketClass(si: number, ti: number) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si].ticketClasses = copy[si].ticketClasses.filter((_, idx) => idx !== ti);
            // Nếu showtime không còn ticket class nào, có thể cân nhắc xóa luôn showtime?
            // if (copy[si].ticketClasses.length === 0) {
            //    return copy.filter((_, idx) => idx !== si);
            // }
            return copy;
        });
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
            // Cần tạo object mới để React nhận diện thay đổi
            copy[si] = {
                ...copy[si],
                ticketClasses: copy[si].ticketClasses.map((tc, index) =>
                    index === ti ? { ...tc, [field]: value } : tc
                )
            };
            return copy;
        });
    }

    // --- (MỚI) Hàm xử lý UI cho Form ---
    function addFormField() {
        setFormFields(prev => [
            ...prev,
            {
                label: `Câu hỏi mới ${prev.length + 1}`,
                type: 'short_answer',
                required: false,
                displayOrder: prev.length + 1,
                options: []
            }
        ]);
    }

    function removeFormField(fi: number) {
        setFormFields(prev => prev.filter((_, idx) => idx !== fi));
    }

    function updateFormField(fi: number, field: keyof FormFieldInput, value: any) {
        setFormFields(prev => prev.map((item, idx) =>
            idx === fi ? { ...item, [field]: value } : item
        ));

        // Nếu đổi type, reset options nếu không phải là loại có option
        if (field === 'type' && value !== 'multiple_choice' && value !== 'checkbox') {
            setFormFields(prev => prev.map((item, idx) =>
                idx === fi ? { ...item, options: [] } : item
            ));
        }
    }

    function addFieldOption(fi: number) {
        setFormFields(prev => prev.map((item, idx) => {
            if (idx === fi) {
                return {
                    ...item,
                    options: [
                        ...item.options,
                        { value: `Lựa chọn ${item.options.length + 1}` }
                    ]
                };
            }
            return item;
        }));
    }

    function removeFieldOption(fi: number, oi: number) {
        setFormFields(prev => prev.map((item, idx) => {
            if (idx === fi) {
                return {
                    ...item,
                    options: item.options.filter((_, optIdx) => optIdx !== oi)
                };
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
                        optIdx === oi ? { ...opt, [field]: value, label: (field === 'value' ? value : opt.label) } : opt // Đơn giản hóa: label = value
                    )
                };
            }
            return item;
        }));
    }

    // --- Hàm Submit Chính ---
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);

        if (!isAdmin || !token) {
            setError("Unauthorized: Admins only.");
            setSaving(false);
            return;
        }
        if (!thumbnailFile) {
            setError("Thumbnail image is required.");
            setSaving(false);
            return;
        }

        let eventId: number | null = null;
        let formId: number | null = null;
        let createdShowtimeId: number | null = null;

        try {
            // --- BƯỚC 1: TẠO EVENT ---
            const eventFormData = new FormData();
            eventFormData.append("title", title);
            eventFormData.append("description", description);
            eventFormData.append("shortkey", shortkey);
            eventFormData.append("thumbnail", thumbnailFile);

            const eventApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events`;
            console.log("Bước 1: Đang tạo Event...");
            const eventResp = await fetch(eventApiUrl, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: eventFormData,
            });

            const eventData = await eventResp.json();
            if (!eventResp.ok) {
                const errMsg = Array.isArray(eventData.message) ? eventData.message.join(', ') : eventData.message;
                throw new Error(`Tạo Event thất bại: ${errMsg || eventResp.statusText}`);
            }

            eventId = eventData.id;
            if (!eventId) {
                throw new Error("Tạo Event thành công nhưng không nhận được ID.");
            }
            console.log(`Bước 1: Tạo Event thành công (ID: ${eventId})`);

            // --- BƯỚC 2: TẠO FORM ---
            console.log(`Bước 2: Đang tạo Form cho Event (ID: ${eventId})...`);
            // **Cần API Endpoint:** POST /forms
            const formApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/forms`;
            const formPayload = {
                title: formTitle,
                description: formDescription,
                eventId: eventId,
            };
            console.log(formPayload);
            const formResp = await fetch(formApiUrl, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formPayload),
            });
            const formData = await formResp.json();
            if (!formResp.ok) {
                const errMsg = Array.isArray(formData.message) ? formData.message.join(', ') : formData.message;
                throw new Error(`Tạo Form thất bại: ${errMsg || formResp.statusText}`);
            }

            formId = formData.id;
            if (!formId) { throw new Error("Tạo Form thành công nhưng không nhận được ID."); }
            console.log(`Bước 2: Tạo Form thành công (ID: ${formId})`);

            // --- BƯỚC 3: TẠO FORM FIELDS (Song song) ---
            console.log(`Bước 3: Đang tạo Form Fields cho Form (ID: ${formId})...`);
            if (Array.isArray(formFields) &&  formFields.length > 0) {
                const fieldPromises = formFields.map(async (fieldInput, index) => {
                    // **Cần API Endpoint:** POST /form-fields
                    const fieldApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/form-fields`;
                    const fieldPayload = {
                        formId: formId,
                        label: fieldInput.label,
                        type: fieldInput.type,
                        required: fieldInput.required,
                        placeholder: fieldInput.placeholder || null,
                        displayOrder: index + 1, // Dùng index làm displayOrder
                        // Gửi options (nếu có)
                        options: fieldInput.options.length > 0 ? fieldInput.options.map(opt => ({
                            value: opt.value,
                            label: opt.label || opt.value,
                        })) : [],
                    };

                    const fieldResp = await fetch(fieldApiUrl, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(fieldPayload),
                    });

                    if (!fieldResp.ok) {
                        const fieldData = await fieldResp.json();
                        const errMsg = Array.isArray(fieldData.message) ? fieldData.message.join(', ') : fieldData.message;
                        throw new Error(`Tạo Form Field "${fieldInput.label}" thất bại: ${errMsg || fieldResp.statusText}`);
                    }
                    console.log(`Tạo Form Field "${fieldInput.label}" thành công.`);
                });

                // Chờ tất cả fields của form tạo xong
                await Promise.all(fieldPromises);
                console.log(`Bước 3: Tạo xong tất cả Form Fields.`);
            }


            // --- BƯỚC 2: TẠO SHOWTIMES (Tuần tự) ---
            // Dùng vòng lặp for...of để `await` hoạt động tuần tự
            for (const [index, showtimeInput] of showtimes.entries()) {

                // --- BƯỚC 2a: TẠO SHOWTIME ---
                console.log(`Bước 2: Đang tạo Showtime #${index + 1}...`);
                const showtimeApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/showtimes`;
                const showtimePayload = {
                    eventId: eventId,
                    start: new Date(showtimeInput.start).toISOString(),
                    end: new Date(showtimeInput.end).toISOString(),
                    location: showtimeInput.location,
                    description: showtimeInput.description,
                };

                // Validate
                if (!showtimePayload.start || !showtimePayload.end || !showtimeInput.start || !showtimeInput.end) {
                    throw new Error(`Showtime #${index + 1}: Start và End time là bắt buộc.`);
                }
                if (new Date(showtimePayload.start) >= new Date(showtimePayload.end)) {
                    throw new Error(`Showtime #${index + 1}: End time phải sau Start time.`);
                }

                const showtimeResp = await fetch(showtimeApiUrl, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(showtimePayload),
                });

                const showtimeData = await showtimeResp.json();
                if (!showtimeResp.ok) {
                    const errMsg = Array.isArray(showtimeData.message) ? showtimeData.message.join(', ') : showtimeData.message;
                    throw new Error(`Tạo Showtime #${index + 1} thất bại: ${errMsg || showtimeResp.statusText}`);
                }

                createdShowtimeId = showtimeData.id;
                if (!createdShowtimeId) {
                    throw new Error(`Tạo Showtime #${index + 1} thành công nhưng không nhận được ID.`);
                }
                console.log(`Bước 2: Tạo Showtime #${index + 1} thành công (ID: ${createdShowtimeId})`);

                // --- BƯỚC 2b: TẠO TICKET CLASSES (Song song cho showtime này) ---
                console.log(`Bước 3: Đang tạo Ticket Classes cho Showtime (ID: ${createdShowtimeId})...`);
                if (showtimeInput.ticketClasses.length === 0) {
                    console.warn(`Showtime #${index + 1} không có loại vé nào.`);
                    continue; // Chuyển sang showtime tiếp theo
                }

                const ticketClassPromises = showtimeInput.ticketClasses.map(async (tcInput) => {
                    const ticketClassApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ticket-classes`;
                    const price = parseFloat(tcInput.price);
                    const quantity = tcInput.quantity ? parseInt(tcInput.quantity, 10) : null;

                    // Validate
                    if (!tcInput.name || isNaN(price) || price < 0) {
                        throw new Error(`Loại vé "${tcInput.name || '(chưa đặt tên)'}" có thông tin không hợp lệ (thiếu tên hoặc giá).`);
                    }
                    if (tcInput.quantity && (isNaN(quantity as number) || (quantity as number) < 1)) {
                        throw new Error(`Loại vé "${tcInput.name}": Số lượng không hợp lệ (phải là số >= 1 hoặc bỏ trống).`);
                    }

                    const ticketClassPayload = {
                        eventId: eventId,
                        showtimeId: createdShowtimeId, // ID của showtime vừa tạo
                        name: tcInput.name,
                        price: price,
                        quantity: quantity,
                        description: tcInput.description,
                        isActive: tcInput.isActive ?? true,
                    };

                    const tcResp = await fetch(ticketClassApiUrl, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(ticketClassPayload),
                    });

                    const tcData = await tcResp.json();
                    if (!tcResp.ok) {
                        const errMsg = Array.isArray(tcData.message) ? tcData.message.join(', ') : tcData.message;
                        throw new Error(`Tạo loại vé "${tcInput.name}" thất bại: ${errMsg || tcResp.statusText}`);
                    }
                    console.log(`Tạo Ticket Class "${tcInput.name}" thành công.`);
                    return tcData;
                });

                // Chờ tất cả ticket classes của showtime NÀY hoàn tất
                await Promise.all(ticketClassPromises);
                console.log(`Bước 3: Tạo xong tất cả Ticket Classes cho Showtime (ID: ${createdShowtimeId}).`);
            } // Kết thúc vòng lặp for...of (chuyển sang showtime tiếp theo)

            // Nếu mọi thứ chạy qua mà không lỗi:
            console.log("Tất cả các bước đã hoàn tất!");
            alert("Sự kiện, showtimes và ticket classes đã được tạo thành công!");
            router.push("/"); // Chuyển hướng về trang chủ

        } catch (err: any) {
            console.error("Đã xảy ra lỗi trong quá trình tạo:", err);

            // Báo lỗi chi tiết hơn
            let finalErrorMessage = err.message;
            if (eventId && !createdShowtimeId) {
                // Lỗi xảy ra khi tạo Showtime đầu tiên
                finalErrorMessage += ` (Lỗi: Đã tạo Event (ID: ${eventId}) nhưng tạo Showtime thất bại. Bạn nên xóa Event này và thử lại.)`;
            } else if (eventId && createdShowtimeId) {
                // Lỗi xảy ra khi tạo Ticket Class hoặc các Showtime sau
                finalErrorMessage += ` (Lỗi: Quá trình bị dừng. Event (ID: ${eventId}) và ít nhất một Showtime (ID: ${createdShowtimeId}) đã được tạo. Vui lòng vào "Chỉnh sửa" để kiểm tra và hoàn tất.)`;
            }

            setError(finalErrorMessage);
        } finally {
            setSaving(false);
        }
    }

    // --- Giao diện JSX (Tương tự code bạn đã cung cấp, có chỉnh sửa) ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-6 border-b pb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tạo sự kiện mới</h1>
                    <p className="text-sm text-gray-500 mt-1">Điền thông tin sự kiện, form đăng ký, và lịch trình.</p>
                </header>

                {!isAdmin && <p className="text-red-600 text-center font-semibold">Access Denied. Only Admins can create events.</p>}

                {isAdmin && (
                    <form onSubmit={onSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-lg shadow-md">

                        {/* --- 1. Event Details (giữ nguyên) --- */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">1. Thông tin sự kiện</h2>
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tên sự kiện <span className="text-red-500">*</span></label>
                                <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2" placeholder="Event Name"/>
                            </div>
                            {/* Shortkey */}
                            <div>
                                <label htmlFor="shortkey" className="block text-sm font-medium text-gray-700">Mã sự kiện (Short Key) <span className="text-red-500">*</span></label>
                                <input id="shortkey" value={shortkey} onChange={(e) => setShortkey(e.target.value.toUpperCase())} required pattern="[A-Z0-9]{3,10}" title="3-10 uppercase letters and numbers" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 uppercase" placeholder="e.g., EVENT24"/>
                                <p className="mt-1 text-xs text-gray-500">Mã định danh duy nhất (3-10 ký tự HOA/số). Dùng cho mã vé.</p>
                            </div>
                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả <span className="text-red-500">*</span></label>
                                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 min-h-[100px]" placeholder="Mô tả chi tiết về sự kiện..."/>
                            </div>
                            {/* Thumbnail */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ảnh bìa (Thumbnail) <span className="text-red-500">*</span></label>
                                <input type="file" accept="image/*" onChange={onThumbnailChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"/>
                                {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail Preview" className="mt-2 h-32 w-auto object-contain rounded border"/>}
                            </div>
                        </section>

                        {/* --- 2. (MỚI) Form Builder --- */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h2 className="text-xl font-semibold text-gray-700">2. Form đăng ký</h2>
                                <button type="button" onClick={addFormField} className="text-sm bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-600">+ Thêm trường</button>
                            </div>

                            {/* Form Title & Desc */}
                            <div>
                                <label htmlFor="formTitle" className="block text-sm font-medium text-gray-700">Tiêu đề Form <span className="text-red-500">*</span></label>
                                <input id="formTitle" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2" />
                            </div>
                            <div>
                                <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">Mô tả Form (Không bắt buộc)</label>
                                <textarea id="formDescription" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm p-2 min-h-[60px]" placeholder="Hướng dẫn hoặc mô tả thêm về form..."/>
                            </div>

                            {/* Form Fields List */}

                            {formFields &&
                                <div className="space-y-4">
                                {formFields.map((field, fi) => (
                                    <div key={fi} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                                        {/* Field Label & Type */}
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
                                        {/* Actions: Required & Remove */}
                                        <div className="flex-shrink-0 flex items-center gap-3 pt-2">
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => updateFormField(fi, 'required', e.target.checked)}
                                                    className="rounded text-gray-600 focus:ring-gray-500 h-4 w-4"
                                                />
                                                <span className="text-xs text-gray-600">Bắt buộc</span>
                                            </label>
                                            <button type="button" onClick={() => removeFormField(fi)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Xóa</button>
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
                                                <div key={oi} className="flex items-center gap-2">
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
                                                    <button type="button" onClick={() => removeFieldOption(fi, oi)} className="text-xs text-gray-500 hover:text-red-600 p-1">&times;</button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addFieldOption(fi)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">+ Thêm lựa chọn</button>
                                        </div>
                                    )}
                                </div>
                                ))}
                                {formFields.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Chưa có trường nào. Bấm "+ Thêm trường" để bắt đầu.</p>}
                            </div>
                            }
                        </section>

                        {/* --- Showtimes & Tickets --- */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h2 className="text-xl font-semibold text-gray-700">Showtimes & Tickets</h2>
                                <button type="button" onClick={addShowtime} className="text-sm bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-600">+ Add Showtime</button>
                            </div>

                            {showtimes.map((s, si) => (
                                <div key={si} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-base font-medium text-gray-800">Showtime #{si + 1}</p>
                                        <button type="button" onClick={() => removeShowtime(si)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Remove Showtime</button>
                                    </div>

                                    {/* Showtime Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-600 block mb-1">Start Time *</label>
                                            <input type="datetime-local" value={s.start} onChange={(e) => updateShowtimeField(si, "start", e.target.value)} required className="p-2 w-full rounded border border-gray-300 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 block mb-1">End Time *</label>
                                            <input type="datetime-local" value={s.end} onChange={(e) => updateShowtimeField(si, "end", e.target.value)} required className="p-2 w-full rounded border border-gray-300 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 block mb-1">Location *</label>
                                            <input type="text" placeholder="Location" value={s.location} onChange={(e) => updateShowtimeField(si, "location", e.target.value)} required className="p-2 w-full rounded border border-gray-300 text-sm" />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-xs text-gray-600 block mb-1">Showtime Description (Optional)</label>
                                            <input type="text" placeholder="Description (optional)" value={s.description || ""} onChange={(e) => updateShowtimeField(si, "description", e.target.value)} className="p-2 w-full rounded border border-gray-300 text-sm" />
                                        </div>
                                    </div>

                                    {/* Ticket Classes for this Showtime */}
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-medium text-gray-700">Ticket Classes</h3>
                                            <button type="button" onClick={() => addTicketClass(si)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">+ Add Ticket</button>
                                        </div>
                                        <div className="space-y-2">
                                            {s.ticketClasses.map((tc, ti) => (
                                                <div key={ti} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm">
                                                    <input className="md:col-span-3 p-2 border rounded border-gray-300" placeholder="Name *" value={tc.name} onChange={(e) => updateTicketClassField(si, ti, "name", e.target.value)} required />
                                                    <input className="md:col-span-2 p-2 border rounded border-gray-300" placeholder="Price *" type="number" step="0.01" min="0" value={tc.price} onChange={(e) => updateTicketClassField(si, ti, "price", e.target.value)} required />
                                                    <input className="md:col-span-2 p-2 border rounded border-gray-300" placeholder="Quantity (opt)" type="number" min="1" value={tc.quantity ?? ""} onChange={(e) => updateTicketClassField(si, ti, "quantity", e.target.value)} />
                                                    <input className="md:col-span-3 p-2 border rounded border-gray-300" placeholder="Description (opt)" value={tc.description ?? ""} onChange={(e) => updateTicketClassField(si, ti, "description", e.target.value)} />
                                                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                                                        {/* <label className="flex items-center space-x-1 cursor-pointer">
                                                             <input type="checkbox" checked={tc.isActive ?? true} onChange={(e) => updateTicketClassField(si, ti, "isActive", e.target.checked)} className="rounded text-gray-600 focus:ring-gray-500 h-4 w-4"/>
                                                             <span className="text-xs">Active</span>
                                                         </label> */}
                                                        <button type="button" onClick={() => removeTicketClass(si, ti)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {s.ticketClasses.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No ticket classes added for this showtime yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {showtimes.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No showtimes added yet.</p>}
                        </section>

                        {/* --- Submit Button & Error Message (giữ nguyên) --- */}
                        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md break-words">{error}</div>}
                        <div className="flex items-center justify-end pt-4 border-t">
                            <button type="submit" disabled={saving || !isAdmin} className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {saving ? "Đang tạo..." : "Tạo sự kiện"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}