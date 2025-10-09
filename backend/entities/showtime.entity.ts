import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Showtime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('datetime', {nullable: false})
    start: Date

    @Column('datetime', {nullable:false})
    end: Date

    @Column()
    location: string;


}