/* backend/src/event/entities/image.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true }) // Tên file gốc hoặc mô tả ảnh
    name: string;

    @Column({ type: 'longblob', nullable: false })
    data: Buffer;

    @Column({ nullable: false }) // Lưu mimetype để trả về Content-Type đúng
    mimetype: string;

    @ManyToOne(() => Event, event => event.images, { nullable: false, onDelete: 'CASCADE' }) // Bắt buộc phải thuộc event
    event: Event;

    @Column({ type: 'int', nullable: true }) // Thêm thứ tự hiển thị nếu cần
    displayOrder: number;
}