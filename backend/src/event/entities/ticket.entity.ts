/* backend/src/event/entities/ticket.entity.ts */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
    UpdateDateColumn, // Thêm UpdateDateColumn
    JoinColumn, // Thêm JoinColumn
} from 'typeorm';
import { User } from "../../user/entities/user.entity";
import { TicketClass } from "./ticketclass.entity";
import { Event } from './event.entity';
// Bỏ import Event vì không còn quan hệ trực tiếp
// Bỏ import uuidv4

// Enum cho trạng thái vé
export enum TicketStatus {
    PENDING_PAYMENT = 'pending_payment', // Chờ thanh toán
    PAID = 'paid',                     // Đã thanh toán (chờ checkin)
    CHECKED_IN = 'checked_in',           // Đã checkin
    CANCELLED = 'cancelled',             // Đã hủy (thanh toán thất bại hoặc lý do khác)
    // ISSUED dùng nếu bạn muốn phân biệt vé admin, nhưng theo yêu cầu là "đã thanh toán" nên dùng PAID
}

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({unique: true})
    @Column({ length: 50, nullable: false })
    ticketCode: string; // Mã vé duy nhất (vd: ABC-RANDOM1234)

    @Column({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.PENDING_PAYMENT,
    })
    status: TicketStatus;

    // Quan hệ với User (người mua vé)
    @ManyToOne(() => User, user => user.tickets, { nullable: true, eager: false })
    @JoinColumn({ name: 'ownerId' }) // Định nghĩa JoinColumn rõ ràng
    owner: User | null;

    @Column({ nullable: true })
    ownerId: number | null; // Foreign key for owner

    // Quan hệ với Loại vé (Giữ nguyên và là quan hệ chính)
    @ManyToOne(() => TicketClass, ticketclass => ticketclass.tickets, { nullable: false, eager: true })
    @JoinColumn({ name: 'ticketClassId' })
    ticketClass: TicketClass;

    @Column({ nullable: false })
    ticketClassId: number; // Foreign key for ticketClass

    // BỎ quan hệ trực tiếp với Event
    @ManyToOne(() => Event, event => event.tickets, { nullable: false, onDelete: 'CASCADE' })
    event: Event;

    @Column({ nullable: false })
    eventId: number;

    @CreateDateColumn()
    purchaseDate: Date; // Ngày tạo (coi như ngày bắt đầu mua)

    @UpdateDateColumn()
    updatedAt: Date; // Ngày cập nhật cuối

    @Column({ default: false })
    isCheckedIn: boolean; // Trạng thái check-in

    @Column({ type: 'datetime', nullable: true }) // Dùng datetime
    checkInTime: Date | null; // Giờ check-in

    // Lưu dữ liệu form
    @Column({ type: 'json', nullable: true })
    formData: Record<string, any> | null;

    /* 🆕 Hai trường bắt buộc */
    @Column({ type: 'varchar', length: 255, nullable: false })
    customerName: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    customerEmail: string;

    @Index() // Thêm Index để tra cứu nhanh
    @Column({ type: 'bigint', nullable: true }) // Bỏ 'unique: true'
    payosPaymentId: number | null;

    // BỎ @BeforeInsert
    // Logic generateTicketCode sẽ được chuyển sang TicketService
}