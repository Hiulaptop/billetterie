import { IsInt, IsNotEmpty, Min, IsOptional, IsObject } from 'class-validator';

export class CreateOrderDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number; // Đã có eventId

    @IsNotEmpty()
    @IsInt()
    showtimeId: number;

    @IsNotEmpty()
    @IsInt()
    ticketClassId: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsObject()
    formData?: Record<string, any>;
}