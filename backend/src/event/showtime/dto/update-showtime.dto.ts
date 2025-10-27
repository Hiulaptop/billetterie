/* backend/src/event/showtime/dto/update-showtime.dto.ts */
import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateShowtimeDto {
    // Không cho phép đổi eventId khi update

    @IsOptional()
    @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date string' })
    start?: string | Date;

    @IsOptional()
    @IsDateString({}, { message: 'End time must be a valid ISO 8601 date string' })
    end?: string | Date;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    location?: string;

    @IsOptional()
    @IsString()
    description?: string;
}