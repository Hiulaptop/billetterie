/* backend/src/event/entities/ticketclass.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Event } from './event.entity';
import { Ticket } from './ticket.entity'; // Import Ticket
import { Showtime } from './showtime.entity'; // Import Showtime

@Entity()
export class TicketClass {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false }) // Sử dụng decimal cho giá tiền
    price: number;

    @Column({ type: 'int', nullable: true }) // Số lượng vé tối đa cho loại này (null = không giới hạn)
    quantity: number | null;

    @Column({ type: 'text', nullable: true })
    description: string; // Mô tả thêm về loại vé

    @Column({ default: true })
    isActive: boolean; // Trạng thái vé (còn bán hay không)

    // Quan hệ với Event (Mỗi loại vé thuộc về 1 event)
    @ManyToOne(() => Event, event => event.ticketClasses, { nullable: false, onDelete: 'CASCADE' })
    event: Event;

    // Quan hệ với Showtime (Mỗi loại vé thuộc về 1 showtime cụ thể)
    // Nếu bạn muốn 1 loại vé áp dụng cho NHIỀU showtime thì dùng ManyToMany
    @ManyToOne(() => Showtime, showtime => showtime.ticketClasses, { nullable: false, onDelete: 'CASCADE' })
    showtime: Showtime;

    // Quan hệ với Ticket (Một loại vé có thể có nhiều vé đã bán)
    @OneToMany(() => Ticket, ticket => ticket.ticketClass)
    tickets: Ticket[];
}