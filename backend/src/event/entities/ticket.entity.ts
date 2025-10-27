/* backend/src/ticket.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert } from 'typeorm';
import { Event } from '../entities/event.entity'; // Sửa đường dẫn import
import { v4 as uuidv4 } from 'uuid'; // Import uuid để tạo phần random

@Entity()
export class Ticket { // Đổi tên class thành Ticket (viết hoa chữ cái đầu)
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false }) // Sẽ được tạo tự động trước khi insert
    ticket_code: string;

    @Column({ nullable: true }) // Cho phép formId là null ban đầu
    formId: string;

    @Column({ nullable: true }) // Cho phép responseId là null ban đầu
    responseId: string;

    @ManyToOne(() => Event, event => event.tickets, { nullable: false, onDelete: 'CASCADE' }) // Quan hệ với Event, bắt buộc, xóa cascade
    event: Event;

    @BeforeInsert()
    generateTicketCode() {
        if (this.event && this.event.shortkey) {
            const randomPart = uuidv4().split('-')[0]; // Lấy phần đầu của UUID v4 làm phần random
            this.ticket_code = `${this.event.shortkey.toUpperCase()}-${randomPart}`;
        } else {
            // Xử lý trường hợp không có event hoặc shortkey (có thể throw lỗi hoặc tạo code mặc định)
            // Ví dụ: throw new Error('Cannot generate ticket code without event shortkey');
            // Hoặc tạo một mã tạm thời/mặc định nếu cần
            const randomPart = uuidv4().split('-')[0];
            this.ticket_code = `TEMP-${randomPart}`; // Mã tạm thời
            console.warn('Ticket created without an event shortkey. Using temporary code.');
        }
    }
}