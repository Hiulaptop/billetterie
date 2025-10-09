import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class TicketClass {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable:false})
    name: string;

    @Column({nullable:false})
    price: number;
}