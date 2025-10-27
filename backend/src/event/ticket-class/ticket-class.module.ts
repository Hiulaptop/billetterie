/* backend/src/event/ticket-class/ticket-class.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketClass } from '../entities/ticketclass.entity';
import { Event } from '../entities/event.entity';
import { Showtime } from '../entities/showtime.entity';
import { TicketClassController } from './ticket-class.controller';
import { TicketClassService } from './ticket-class.service';

@Module({
    imports: [TypeOrmModule.forFeature([TicketClass, Event, Showtime])],
    controllers: [TicketClassController],
    providers: [TicketClassService],
    exports: [TicketClassModule] // Export
})
export class TicketClassModule {}