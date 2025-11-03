import { IsInt, IsNotEmpty, Min, IsOptional, IsObject, IsEmail, IsString } from 'class-validator';

export class CreateOrderDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number; // ID của sự kiện

    @IsNotEmpty()
    @IsInt()
    showtimeId: number; // ID của suất chiếu

    @IsNotEmpty()
    @IsInt()
    ticketClassId: number; // ID loại vé

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number; // Số lượng vé

    // 🧾 Dữ liệu form tuỳ chọn (các câu hỏi thêm, số điện thoại, v.v.)
    @IsOptional()
    @IsObject()
    formData?: Record<string, any>;

    // 👤 Thông tin khách hàng - bắt buộc
    @IsNotEmpty()
    @IsString()
    customerName: string;

    @IsNotEmpty()
    @IsEmail()
    customerEmail: string;
}
