/* backend/src/event/entities/showtime.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'; // Thêm OneToMany
import { Event } from './event.entity';
import { TicketClass } from './ticketclass.entity'; // Import TicketClass

@Entity()
export class Showtime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('datetime', { nullable: false })
    start: Date;

    @Column('datetime', { nullable: false })
    end: Date;

    @Column({ nullable: false }) // Địa điểm là bắt buộc
    location: string;

    @Column({ type: 'text', nullable: true }) // Mô tả thêm về showtime
    description: string;

    @ManyToOne(() => Event, event => event.showtimes, { nullable: false, onDelete: 'CASCADE' }) // Bắt buộc phải thuộc event
    event: Event;

    // Quan hệ với TicketClass (Một showtime có nhiều loại vé)
    @OneToMany(() => TicketClass, ticketClass => ticketClass.showtime, { cascade: true, nullable: true })
    ticketClasses: TicketClass[];
}