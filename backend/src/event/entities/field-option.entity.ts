/* backend/src/event/entities/field-option.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FormField } from './form-field.entity';

@Entity()
export class FieldOption {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => FormField, field => field.options, { nullable: false, onDelete: 'CASCADE' }) // Phải thuộc về 1 FormField
    field: FormField;

    @Column({ nullable: false })
    value: string; // Giá trị của lựa chọn (ví dụ: "Male", "Female", "Option A")

    @Column({ nullable: true })
    label: string; // Nhãn hiển thị nếu khác value (ví dụ: "Nam", "Nữ")

    @Column({ type: 'int', nullable: true }) // Thứ tự hiển thị của option
    displayOrder: number;
}