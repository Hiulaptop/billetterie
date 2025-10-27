/* backend/src/event/showtime/dto/create-showtime.dto.ts */
import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateShowtimeDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number; // ID của Event

    @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date string' })
    @IsNotEmpty()
    start: string | Date; // Thời gian bắt đầu

    @IsDateString({}, { message: 'End time must be a valid ISO 8601 date string' })
    @IsNotEmpty()
    end: string | Date; // Thời gian kết thúc

    @IsString()
    @IsNotEmpty()
    location: string; // Địa điểm

    @IsOptional()
    @IsString()
    description?: string; // Mô tả thêm
}