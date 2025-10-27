/* backend/entities/event.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { TicketClass } from './ticketclass.entity';
import { Showtime } from './showtime.entity';
import { Image } from './image.entity';
import { Form } from './form.entity'; // Import Form entity
import { Ticket } from './ticket.entity'; // Import Ticket entity

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: false })
    description: string;

    @Column({ type: 'longblob', nullable: false })
    thumbnail: Buffer;

    @Column({ nullable: false, unique: true }) // Thêm trường shortkey, bắt buộc và duy nhất
    shortkey: string;

    @OneToMany(() => TicketClass, ticketClass => ticketClass.event, { cascade: true, nullable: true }) // Cho phép null
    ticketClasses: TicketClass[];

    @OneToMany(() => Showtime, showtime => showtime.event, { cascade: true, nullable: true }) // Cho phép null
    showtimes: Showtime[];

    @OneToMany(() => Image, image => image.event, { cascade: true, nullable: true }) // Cho phép null
    images: Image[];

    @OneToOne(() => Form, form => form.event, { cascade: true, nullable: true, onDelete: 'SET NULL' }) // Mối quan hệ một-một với Form, cho phép null, cascade và set null khi xóa Event
    @JoinColumn()
    form: Form;

    @OneToMany(() => Ticket, ticket => ticket.event) // Mối quan hệ một-nhiều với Ticket
    tickets: Ticket[];
}