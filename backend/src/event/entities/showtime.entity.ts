/* backend/entities/showtime.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class Showtime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('datetime', { nullable: false })
    start: Date;

    @Column('datetime', { nullable: false })
    end: Date;

    @Column()
    location: string;

    @ManyToOne(() => Event, event => event.showtimes, { onDelete: 'CASCADE' }) // Thêm onDelete Cascade
    event: Event;
}