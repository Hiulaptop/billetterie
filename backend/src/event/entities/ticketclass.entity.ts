/* backend/entities/ticketclass.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class TicketClass {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    price: number;

    @ManyToOne(() => Event, event => event.ticketClasses, { onDelete: 'CASCADE' }) // Thêm onDelete Cascade
    event: Event;
}