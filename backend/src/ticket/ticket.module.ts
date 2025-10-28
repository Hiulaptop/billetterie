import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../event/entities/ticket.entity';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { EventModule } from '../event/event.module'; // EventModule chứa TicketClass
import { UserModule } from '../user/user.module';
// Import TicketClass entity để TicketService có thể inject Repository
import { TicketClass } from '../event/entities/ticketclass.entity';
import { Event } from '../event/entities/event.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Ticket, TicketClass, Event]), // Import các Entity cần dùng
        forwardRef(() => EventModule), // Module Event có thể cần TicketService
        UserModule, // Dùng cho RolesGuard
    ],
    providers: [TicketService],
    controllers: [TicketController],
    exports: [TicketService], // Export Service để OrdersModule và PayOSModule sử dụng
})
export class TicketModule {}