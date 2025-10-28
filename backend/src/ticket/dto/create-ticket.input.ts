/* backend/src/ticket/dto/create-ticket.input.ts */
import { IsInt, IsNotEmpty, IsOptional, IsString, IsEmail, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketInput {
    @IsInt()
    @IsNotEmpty()
    eventId: number;

    @IsInt()
    @IsNotEmpty()
    showtimeId: number;

    @IsInt()
    @IsNotEmpty()
    ticketClassId: number;

    @IsInt()
    @IsNotEmpty()
    quantity: number; // Số lượng muốn mua (Backend sẽ xử lý tạo từng vé)

    @IsOptional()
    @IsObject() // Hoặc ValidateNested nếu có DTO cụ thể cho formData
    formData?: Record<string, any>;

    @IsOptional()
    @IsInt()
    userId?: number | null; // ID của user nếu đăng nhập

    // Thông tin khách nếu không đăng nhập
    @IsOptional()
    @IsString()
    customerName?: string;

    @IsOptional()
    @IsEmail()
    customerEmail?: string;
}