/* backend/entities/image.entity.ts */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Event } from './event.entity'; // Import Event entity

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ type: 'longblob', nullable: false })
    data: Buffer;

    @Column()
    mimetype: string;

    @ManyToOne(() => Event, event => event.images, { nullable: true, onDelete: 'CASCADE' }) // Thêm mối quan hệ ManyToOne với Event, cho phép null và onDelete Cascade
    event?: Event;
}