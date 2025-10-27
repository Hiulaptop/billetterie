/* backend/src/event/ticket-class/dto/update-ticket-class.dto.ts */
import {IsString, IsOptional, IsNumber, Min, IsInt, IsBoolean, IsNotEmpty} from 'class-validator';

export class UpdateTicketClassDto {
    // Không cho phép đổi eventId hoặc showtimeId

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    quantity?: number | null;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}