/* backend/src/ticket/entities/ticket.entity.ts */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    BeforeInsert,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from "../../user/entities/user.entity";
import { TicketClass } from "../../event/entities/ticketclass.entity";
import { Event } from '../../event/entities/event.entity'; // Import Event
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ length: 50, nullable: false, unique: true })
    ticketCode: string; // Đổi tên và thêm unique

    // Quan hệ với User (người mua vé)
    // nullable: true cho phép mua vé không cần đăng nhập
    @ManyToOne(() => User, user => user.tickets, { nullable: true, eager: false })
    owner: User | null;

    // Thông tin khách vãng lai (nếu owner là null)
    @Column({ nullable: true })
    customerName: string;

    @Column({ nullable: true })
    customerEmail: string;

    // Quan hệ với Loại vé
    // Một loại vé có nhiều vé
    @ManyToOne(() => TicketClass, ticketclass => ticketclass.tickets, { nullable: false, eager: true })
    ticketClass: TicketClass;

    // Quan hệ với Event (để tạo shortkey và truy vấn)
    @ManyToOne(() => Event, event => event.tickets, { nullable: false, onDelete: 'CASCADE' })
    event: Event;

    @CreateDateColumn()
    purchaseDate: Date; // Ngày mua

    @Column({ default: false })
    isCheckedIn: boolean; // Trạng thái check-in

    @Column({ nullable: true })
    checkInTime: Date; // Giờ check-in

    // Lưu dữ liệu form (nếu có)
    @Column({ type: 'json', nullable: true })
    formData: Record<string, any>;

    @BeforeInsert()
    generateTicketCode() {
        // Phải gán Event (this.event) và Event.shortkey trước khi save
        if (this.event && this.event.shortkey) {
            const randomPart = uuidv4().split('-')[0].toUpperCase();
            this.ticketCode = `${this.event.shortkey.toUpperCase()}-${randomPart}`;
        } else {
            // Trường hợp này không nên xảy ra nếu logic service đúng
            throw new Error('Event and shortkey must be set before saving a ticket.');
        }
    }
}