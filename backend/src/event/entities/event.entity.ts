/* backend/src/event/entities/event.entity.ts */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    OneToOne,
    JoinColumn,
    ManyToOne, // Thêm ManyToOne
    ManyToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TicketClass } from './ticketclass.entity';
import { Showtime } from './showtime.entity';
import { Image } from './image.entity';
import { Form } from './form.entity';
import { Ticket } from './ticket.entity';
import { User } from '../../user/entities/user.entity'; // Import User entity

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false }) // Sử dụng 'text' cho mô tả dài hơn
    description: string;

    @Column({ type: 'longblob', nullable: false }) // Thumbnail vẫn bắt buộc khi tạo
    thumbnail: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    shortkey: string | null;


    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => TicketClass, ticketClass => ticketClass.event, { cascade: true, nullable: true })
    ticketClasses: TicketClass[];

    @OneToMany(() => Showtime, showtime => showtime.event, { cascade: true, nullable: true })
    showtimes: Showtime[];

    @OneToMany(() => Image, image => image.event, { cascade: true, nullable: true })
    images: Image[];

    @OneToOne(() => Form, form => form.event, { cascade: true, nullable: true, onDelete: 'SET NULL', eager: false }) // Cho phép null, cascade insert/update, set null khi event bị xóa
    @JoinColumn() // Event là chủ sở hữu của mối quan hệ
    form: Form;

    @OneToMany(() => Ticket, ticket => ticket.event)
    tickets: Ticket[];

    // Bỏ quan hệ ManyToMany với User (customers và staffs) nếu không cần thiết nữa
    // Nếu vẫn cần thì giữ lại và cập nhật User entity
    // @ManyToMany(() => User, user => user.ordered_events)
    // customers: User[];

    @OneToMany(() => User, user => user.staff_event)
    staffs: User[];
}