import {Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, Unique} from 'typeorm';

@Entity()
export class ticket{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    ticket_code: string;

    @Column()
    formId: string;

    @Column()
    responseId: string;
}