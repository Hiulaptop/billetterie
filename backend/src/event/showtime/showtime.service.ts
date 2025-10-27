/* backend/src/event/showtime/showtime.service.ts */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from '../entities/showtime.entity';
import { Event } from '../entities/event.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Injectable()
export class ShowtimeService {
    constructor(
        @InjectRepository(Showtime)
        private showtimeRepository: Repository<Showtime>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
    ) {}

    async create(createDto: CreateShowtimeDto): Promise<Showtime> {
        const event = await this.eventRepository.findOne({ where: { id: createDto.eventId } });
        if (!event) {
            throw new NotFoundException(`Event with ID ${createDto.eventId} not found.`);
        }

        const newShowtime = this.showtimeRepository.create({
            ...createDto,
            start: new Date(createDto.start),
            end: new Date(createDto.end),
            event: event,
        });
        return this.showtimeRepository.save(newShowtime);
    }

    async findAllByEvent(eventId: number): Promise<Showtime[]> {
        return this.showtimeRepository.find({
            where: { event: { id: eventId } },
            relations: ['event', 'ticketClasses'],
            order: { start: 'ASC' }
        });
    }

    async findOne(id: number): Promise<Showtime> {
        const showtime = await this.showtimeRepository.findOne({
            where: { id },
            relations: ['event', 'ticketClasses']
        });
        if (!showtime) {
            throw new NotFoundException(`Showtime with ID ${id} not found.`);
        }
        return showtime;
    }

    async update(id: number, updateDto: UpdateShowtimeDto): Promise<Showtime> {
        const showtime = await this.findOne(id); // Check tồn tại

        const updateData: any = { ...updateDto };
        if (updateDto.start) updateData.start = new Date(updateDto.start);
        if (updateDto.end) updateData.end = new Date(updateDto.end);

        this.showtimeRepository.merge(showtime, updateData);
        return this.showtimeRepository.save(showtime);
    }

    async remove(id: number): Promise<void> {
        // TODO: Kiểm tra xem showtime có ticket class/ticket đã bán không
        const result = await this.showtimeRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Showtime with ID ${id} not found.`);
        }
    }
}