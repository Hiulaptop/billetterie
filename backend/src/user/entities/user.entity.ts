import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, BeforeInsert, OneToOne} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Event } from '../../event/entities/event.entity';
import {Ticket} from "../../ticket/entities/ticket.entity";
import { Role } from "../enums/role.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable:false})
    username: string;

    @Column({nullable:false})
    display_name: string;

    @Column({nullable:false})
    email: string;

    @Column({nullable:false})
    password: string;

    @Column({
        type: 'enum',
        enum: Role,
        // default: Role.User,
    })
    role: Role;

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    @ManyToMany(type => Event, event => event.customers)
    ordered_events: Event[];

    @OneToOne(()=>Ticket, ticket => ticket.user)
    ticket: Ticket;

    @ManyToOne(type => Event, event => event.staffs)
    staff_event: Event;
}