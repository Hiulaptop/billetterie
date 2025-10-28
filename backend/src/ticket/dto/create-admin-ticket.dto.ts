import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateAdminTicketDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number;

    // Mặc dù TicketClass đã thuộc Event, DTO vẫn nên lấy cả 2
    // để xác nhận và để TicketService gán Event
    @IsNotEmpty()
    @IsInt()
    ticketClassId: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number;
}