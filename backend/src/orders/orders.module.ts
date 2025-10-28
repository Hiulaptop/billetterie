import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketClass } from '../event/entities/ticketclass.entity';
import { Event } from '../event/entities/event.entity'; // Import Event
import { TicketModule } from '../ticket/ticket.module';
import { PayosModule } from '../payos/payos.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TicketClass, Event]), // Import TicketClass và Event
        TicketModule,
        PayosModule,
        UserModule,
    ],
    providers: [OrdersService],
    controllers: [OrdersController],
})
export class OrdersModule {}