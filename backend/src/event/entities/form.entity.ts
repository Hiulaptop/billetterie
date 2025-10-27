/* backend/entities/form.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { Event } from './event.entity';
import { FormField } from './form-field.entity';

@Entity()
export class Form {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: true })
    description: string;

    @OneToOne(() => Event, event => event.form)
    event: Event;

    @OneToMany(() => FormField, field => field.form, { cascade: true, eager: true }) // Eager loading để lấy field cùng lúc với form
    fields: FormField[];
}