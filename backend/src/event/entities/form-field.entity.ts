/* backend/src/event/entities/form-field.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Form } from './form.entity';
import { FieldOption } from './field-option.entity';

// Enum định nghĩa các loại trường
export enum FieldType {
    SHORT_ANSWER = 'short_answer',
    LONG_ANSWER = 'long_answer',
    DATE = 'date',
    CHECKBOX = 'checkbox', // Cho phép chọn nhiều
    MULTIPLE_CHOICE = 'multiple_choice', // Chỉ cho phép chọn một
    // Thêm các loại khác nếu cần: email, phone, dropdown,...
}

@Entity()
export class FormField {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Form, form => form.fields, { nullable: false, onDelete: 'CASCADE' }) // Phải thuộc về 1 Form
    form: Form;

    @Column({ nullable: false })
    label: string; // Tên/Câu hỏi của trường

    @Column({
        type: 'enum',
        enum: FieldType,
        nullable: false,
    })
    type: FieldType;

    @Column({ default: false })
    required: boolean; // Trường này có bắt buộc không

    @Column({ type: 'int', nullable: true }) // Thứ tự hiển thị của trường trong form
    displayOrder: number;

    @Column({ nullable: true }) // Text gợi ý/placeholder
    placeholder: string;

    // Chỉ áp dụng cho CHECKBOX và MULTIPLE_CHOICE
    // Một FormField có nhiều FieldOption
    @OneToMany(() => FieldOption, option => option.field, { cascade: true, eager: true, nullable: true }) // Cascade và Eager loading options
    options: FieldOption[];
}