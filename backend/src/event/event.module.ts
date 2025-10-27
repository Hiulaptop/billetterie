/* backend/src/event/event.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './entities/event.entity'; // Import Event entity
import { TicketClass } from './entities/ticketclass.entity'; // Import TicketClass
import { Showtime } from './entities/showtime.entity'; // Import Showtime
import { Image } from './entities/image.entity'; // Import Image
import { Form } from './entities/form.entity'; // Import Form
import { FormField } from './entities/form-field.entity'; // Import FormField
import { FieldOption } from './entities/field-option.entity'; // Import FieldOption
import { Ticket } from './entities/ticket.entity'; // Import Ticket

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
        ])
    ],
    controllers: [EventController],
    providers: [EventService],
})
export class EventModule {}