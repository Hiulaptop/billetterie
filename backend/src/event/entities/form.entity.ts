/* backend/src/event/entities/form.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Event } from './event.entity';
import { FormField } from './form-field.entity';

@Entity()
export class Form {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    // Quan hệ một-một ngược lại với Event
    @OneToOne(() => Event, event => event.form)
        // @JoinColumn() // JoinColumn nên ở phía chủ sở hữu (Event)
    event: Event;

    // Một Form có nhiều FormField
    @OneToMany(() => FormField, field => field.form, { cascade: true, eager: true }) // Cascade để tự động lưu/xóa field, Eager để load field cùng form
    fields: FormField[];
}