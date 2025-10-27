/* backend/entities/field-option.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FormField } from './form-field.entity';

@Entity()
export class FieldOption {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    value: string; // Giá trị của lựa chọn

    @ManyToOne(() => FormField, field => field.options, { onDelete: 'CASCADE' })
    field: FormField;
}