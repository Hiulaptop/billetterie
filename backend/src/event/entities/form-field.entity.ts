/* backend/entities/form-field.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Form } from './form.entity';
import { FieldOption } from './field-option.entity';

export enum FieldType {
    SHORT_ANSWER = 'short_answer',
    LONG_ANSWER = 'long_answer',
    DATE = 'date',
    CHECKBOX = 'checkbox',
    MULTIPLE_CHOICE = 'multiple_choice',
}

@Entity()
export class FormField {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    label: string;

    @Column({
        type: 'enum',
        enum: FieldType,
        nullable: false,
    })
    type: FieldType;

    @Column({ default: false })
    required: boolean;

    @ManyToOne(() => Form, form => form.fields, { onDelete: 'CASCADE' })
    form: Form;

    // Chỉ áp dụng cho CHECKBOX và MULTIPLE_CHOICE
    @OneToMany(() => FieldOption, option => option.field, { cascade: true, nullable: true })
    options: FieldOption[];
}