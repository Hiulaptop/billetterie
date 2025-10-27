"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // sửa lại cho Next 13+

type TicketClassInput = {
    name: string;
    price: string;
    quantity?: string;
};

type ShowtimeInput = {
    start: string;
    end: string;
    location: string;
    ticketclasses: TicketClassInput[];
};

export default function CreateEventPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [googleFormUrl, setGoogleFormUrl] = useState("");
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [showtimes, setShowtimes] = useState<ShowtimeInput[]>([
        {
            start: "",
            end: "",
            location: "",
            ticketclasses: [{ name: "", price: "", quantity: "0" }],
        },
    ]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function onThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setThumbnailFile(f);
        setThumbnailPreview(URL.createObjectURL(f));
    }

    function onImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        setImageFiles((prev) => prev.concat(files));
        const urls = files.map((f) => URL.createObjectURL(f));
        setImagePreviews((prev) => prev.concat(urls));
    }

    function removeImageAt(i: number) {
        setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
        setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
    }

    function addShowtime() {
        setShowtimes((prev) =>
            prev.concat({
                start: "",
                end: "",
                location: "",
                ticketclasses: [{ name: "", price: "", quantity: "0" }],
            })
        );
    }

    function removeShowtime(i: number) {
        setShowtimes((prev) => prev.filter((_, idx) => idx !== i));
    }

    function addTicketClass(si: number) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si].ticketclasses.push({ name: "", price: "", quantity: "0" });
            return copy;
        });
    }

    function removeTicketClass(si: number, ti: number) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si].ticketclasses = copy[si].ticketclasses.filter(
                (_, idx) => idx !== ti
            );
            return copy;
        });
    }

    function updateShowtimeField(
        si: number,
        field: keyof ShowtimeInput,
        value: string
    ) {
        setShowtimes((prev) => {
            const copy = [...prev];
            (copy[si] as any)[field] = value;
            return copy;
        });
    }

    function updateTicketClassField(
        si: number,
        ti: number,
        field: keyof TicketClassInput,
        value: string
    ) {
        setShowtimes((prev) => {
            const copy = [...prev];
            copy[si].ticketclasses[ti] = {
                ...copy[si].ticketclasses[ti],
                [field]: value,
            };
            return copy;
        });
    }

    // ✅ Cập nhật phần này để có kiểm tra JWT
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // 1️⃣ Kiểm tra JWT
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Bạn chưa đăng nhập hoặc token không tồn tại.");
            return;
        }

        // 2️⃣ Kiểm tra dữ liệu cơ bản
        if (!title.trim() || !description.trim()) {
            setError("Tiêu đề và mô tả là bắt buộc.");
            return;
        }

        setSaving(true);
        try {
            const form = new FormData();
            form.append("title", title);
            form.append("description", description);
            if (googleFormUrl) form.append("google_form_url", googleFormUrl);
            if (thumbnailFile) form.append("thumbnail", thumbnailFile);
            imageFiles.forEach((f) => form.append("images", f));

            const stPayload = showtimes.map((s) => ({
                start: s.start,
                end: s.end,
                location: s.location,
                ticketclasses: s.ticketclasses.map((tc) => ({
                    name: tc.name,
                    price: tc.price,
                    quantity: tc.quantity ?? 0,
                })),
            }));
            form.append("showtimes", JSON.stringify(stPayload));

            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events`;

            // 3️⃣ Gửi request với header Authorization
            const resp = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: form,
            });

            const data = await resp.json().catch(() => null);

            if (!resp.ok) {
                throw new Error(data?.message || "Tạo event thất bại");
            }

            alert("Tạo sự kiện thành công!");
            router.push("/"); // chuyển hướng sau khi tạo thành công
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Lỗi mạng hoặc server.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-extrabold text-slate-800">Tạo sự kiện mới</h1>
                    <p className="text-sm text-slate-500 mt-1">Thiết lập thông tin cơ bản, showtime, giá vé và nhúng Google Form.</p>
                </header>

                <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow">
                    {/* Title & Description */}
                    <section className="grid grid-cols-1 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Tiêu đề</span>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-slate-300 p-2"
                                placeholder="Tên sự kiện"
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Mô tả</span>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-slate-300 p-3 min-h-[120px]"
                                placeholder="Mô tả chi tiết (chương trình, nội dung...)"
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Google Form (optional)</span>
                            <input
                                value={googleFormUrl}
                                onChange={(e) => setGoogleFormUrl(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-slate-300 p-2"
                                placeholder="https://docs.google.com/forms/..."
                            />
                            <p className="text-xs text-slate-400 mt-1">Nếu admin tạo form riêng, dán link nhúng ở đây để show lên trang event.</p>
                        </label>
                    </section>

                    {/* Thumbnail & Images */}
                    <section className="grid md:grid-cols-2 gap-4 items-start">
                        <div className="rounded-lg border border-dashed border-slate-200 p-4 bg-slate-50">
                            <div className="mb-2">
                                <span className="text-sm font-medium text-slate-700">Thumbnail</span>
                                <p className="text-xs text-slate-400">Hình ảnh chính hiển thị tại danh sách.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="relative cursor-pointer inline-block">
                                    <input type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
                                    <div className="w-40 h-28 bg-white rounded-md border flex items-center justify-center overflow-hidden">
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} alt="thumbnail" className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="text-xs text-slate-400 px-2 text-center">Chọn file</div>
                                        )}
                                    </div>
                                </label>

                                <div className="text-sm text-slate-500">
                                    <div>Kích thước đề xuất: 1200x675</div>
                                    {thumbnailFile && <div className="mt-1 text-xs text-slate-600">{thumbnailFile.name}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-dashed border-slate-200 p-4 bg-slate-50">
                            <div className="mb-2">
                                <span className="text-sm font-medium text-slate-700">Ảnh bổ sung</span>
                                <p className="text-xs text-slate-400">Hỗ trợ ảnh gallery (bản trình diễn, sân khấu,...)</p>
                            </div>
                            <input type="file" multiple accept="image/*" onChange={onImagesChange} />
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative group">
                                        <img src={src} className="w-full h-20 object-cover rounded-md" alt={`img-${i}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImageAt(i)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Showtimes */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-slate-800">Showtimes & Ticket classes</h2>
                            <button type="button" onClick={addShowtime} className="text-sm bg-slate-700 text-white px-3 py-1 rounded-md">+ Add Showtime</button>
                        </div>

                        <div className="space-y-4">
                            {showtimes.map((s, si) => (
                                <div key={si} className="p-4 bg-white rounded-lg border shadow-sm">
                                    <div className="flex justify-between mb-3">
                                        <div className="text-sm font-medium">Showtime #{si + 1}</div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => addTicketClass(si)} className="text-xs px-2 py-1 rounded bg-slate-100">+ Ticket</button>
                                            <button type="button" onClick={() => removeShowtime(si)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600">Remove</button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3">
                                        <input type="datetime-local" value={s.start} onChange={(e) => updateShowtimeField(si, "start", e.target.value)} className="p-2 rounded border" />
                                        <input type="datetime-local" value={s.end} onChange={(e) => updateShowtimeField(si, "end", e.target.value)} className="p-2 rounded border" />
                                        <input type="text" placeholder="Location" value={s.location} onChange={(e) => updateShowtimeField(si, "location", e.target.value)} className="p-2 rounded border" />
                                    </div>

                                    <div className="mt-3">
                                        <div className="text-sm font-medium mb-2">Ticket classes</div>
                                        <div className="space-y-2">
                                            {s.ticketclasses.map((tc, ti) => (
                                                <div key={ti} className="grid grid-cols-12 gap-2 items-center">
                                                    <input className="col-span-4 p-2 border rounded" placeholder="Name" value={tc.name} onChange={(e) => updateTicketClassField(si, ti, "name", e.target.value)} />
                                                    <input className="col-span-3 p-2 border rounded" placeholder="Price" type="number" value={tc.price} onChange={(e) => updateTicketClassField(si, ti, "price", e.target.value)} />
                                                    <input className="col-span-3 p-2 border rounded" placeholder="Quantity" type="number" value={tc.quantity ?? "0"} onChange={(e) => updateTicketClassField(si, ti, "quantity", e.target.value)} />
                                                    <div className="col-span-2 text-right">
                                                        <button type="button" onClick={() => removeTicketClass(si, ti)} className="text-sm text-red-600">Remove</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {error && <div className="text-sm text-red-600">{error}</div>}

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-500">Bạn có thể sửa event sau khi tạo.</div>
                        <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-500 disabled:opacity-60">
                            {saving ? "Đang lưu..." : "Tạo event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
