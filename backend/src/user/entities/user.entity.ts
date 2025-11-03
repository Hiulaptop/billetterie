/* backend/src/user/entities/user.entity.ts */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    BeforeInsert,
    OneToMany, // Thêm OneToMany
    Index, // Thêm Index
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Event } from '../../event/entities/event.entity';
import { Ticket } from '../../event/entities/ticket.entity'; // Sửa đường dẫn nếu cần
import { Role } from "../enums/role.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({unique: true}) // Thêm unique index
    @Column({ nullable: false })
    username: string;

    @Column({ nullable: false })
    displayName: string; // Đổi thành camelCase

    // @Index({ unique: true }) // Thêm unique index
    @Column({ nullable: false, unique: true })
    email: string;

    @Column({ nullable: false, select: false }) // select: false - không trả về password
    password: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.User, // Nên có default
    })
    role: Role;

    @BeforeInsert()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    // Các vé mà User này sở hữu (nếu họ mua khi đã đăng nhập)
    @OneToMany(() => Ticket, ticket => ticket.owner)
    tickets: Ticket[];

    // Event mà User này là staff (quan hệ này khớp với Event)
    @ManyToOne(() => Event, event => event.staffs, { nullable: true, onDelete: 'SET NULL' })
    staff_event: Event | null;

    // Bỏ quan hệ ordered_events và ticket (OneToOne)
}