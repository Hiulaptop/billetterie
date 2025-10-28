/* backend/src/event/event.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './entities/event.entity';
import { TicketClass } from './entities/ticketclass.entity';
import { Showtime } from './entities/showtime.entity';
import { Image } from './entities/image.entity';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FieldOption } from './entities/field-option.entity';
import { Ticket } from '../event/entities/ticket.entity'; // Sửa đường dẫn
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module'; // Import UserModule

// Import các module con
import { ShowtimeModule } from './showtime/showtime.module';
import { TicketClassModule } from './ticket-class/ticket-class.module';
import { FormModule } from './form/form.module';
// import { ImageModule } from './image/image.module'; // (Nếu có)
import { TicketModule } from '../ticket/ticket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Event,
            TicketClass,
            Showtime,
            Image,
            Form,
            FormField,
            FieldOption,
            Ticket,
            User, // Thêm User
        ]),
        UserModule, // Import UserModule để inject UserService
        // Import các module con
        ShowtimeModule,
        TicketClassModule,
        FormModule,
        TicketModule,
        // ImageModule,
    ],
    controllers: [EventController],
    providers: [EventService],
    exports: [EventService],
})
export class EventModule {}