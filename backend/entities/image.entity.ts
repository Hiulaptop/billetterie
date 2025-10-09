import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    name: string;

    @Column({ type: 'longblob', nullable:false })
    data: Buffer;

    @Column()
    mimetype: string;
}