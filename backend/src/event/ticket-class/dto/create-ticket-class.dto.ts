/* backend/src/event/ticket-class/dto/create-ticket-class.dto.ts */
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateTicketClassDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number; // ID của Event

    @IsNotEmpty()
    @IsInt()
    showtimeId: number; // ID của Showtime

    @IsString()
    @IsNotEmpty()
    name: string; // Tên loại vé

    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a number with max 2 decimal places' })
    @Min(0, { message: 'Price must be at least 0' })
    price: number; // Giá vé

    @IsOptional()
    @IsInt()
    @Min(1)
    quantity?: number | null; // Số lượng (null = không giới hạn)

    @IsOptional()
    @IsString()
    description?: string; // Mô tả loại vé

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true; // Trạng thái
}