import {Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn} from 'typeorm';
import { User } from "../../user/entities/user.entity";
import { TicketClass } from "../../event/entities/ticketclass.entity";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable:false})
    ticket_code: string;

    @OneToOne(() => User, user => user.ticket)
    @JoinColumn()
    user: User;

    @OneToOne(() => TicketClass, ticketclass => ticketclass.ticket)
    @JoinColumn()
    ticketclass: TicketClass;
}