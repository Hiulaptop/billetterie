/* backend/src/event/ticket-class/ticket-class.service.ts */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketClass } from '../entities/ticketclass.entity';
import { Event } from '../entities/event.entity';
import { Showtime } from '../entities/showtime.entity';
import { CreateTicketClassDto } from './dto/create-ticket-class.dto';
import { UpdateTicketClassDto } from './dto/update-ticket-class.dto';

@Injectable()
export class TicketClassService {
    constructor(
        @InjectRepository(TicketClass)
        private ticketClassRepository: Repository<TicketClass>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Showtime)
        private showtimeRepository: Repository<Showtime>,
    ) {}

    async create(createDto: CreateTicketClassDto): Promise<TicketClass> {
        const event = await this.eventRepository.findOne({ where: { id: createDto.eventId } });
        if (!event) {
            throw new NotFoundException(`Event with ID ${createDto.eventId} not found.`);
        }

        const showtime = await this.showtimeRepository.findOne({
            where: { id: createDto.showtimeId, event: { id: createDto.eventId } }
        });
        if (!showtime) {
            throw new NotFoundException(`Showtime with ID ${createDto.showtimeId} not found or does not belong to Event ${createDto.eventId}.`);
        }

        const newTicketClass = this.ticketClassRepository.create({
            ...createDto,
            event: event,
            showtime: showtime,
        });
        return this.ticketClassRepository.save(newTicketClass);
    }

    async findAllByShowtime(showtimeId: number): Promise<TicketClass[]> {
        const showtime = await this.showtimeRepository.findOne({ where: { id: showtimeId } });
        if (!showtime) {
            throw new NotFoundException(`Showtime with ID ${showtimeId} not found.`);
        }
        return this.ticketClassRepository.find({
            where: { showtime: { id: showtimeId } },
            relations: ['showtime', 'event']
        });
    }

    async findOne(id: number): Promise<TicketClass> {
        const ticketClass = await this.ticketClassRepository.findOne({
            where: { id },
            relations: ['showtime', 'event', 'tickets']
        });
        if (!ticketClass) {
            throw new NotFoundException(`TicketClass with ID ${id} not found.`);
        }
        return ticketClass;
    }

    async update(id: number, updateDto: UpdateTicketClassDto): Promise<TicketClass> {
        const ticketClass = await this.ticketClassRepository.findOne({ where: { id } });
        if (!ticketClass) {
            throw new NotFoundException(`TicketClass with ID ${id} not found.`);
        }

        this.ticketClassRepository.merge(ticketClass, updateDto);
        return this.ticketClassRepository.save(ticketClass);
    }

    async remove(id: number): Promise<void> {
        const ticketClass = await this.findOne(id); // Lấy relations 'tickets'
        if (ticketClass.tickets && ticketClass.tickets.length > 0) {
            throw new BadRequestException(`Cannot delete TicketClass ID ${id}: it has associated tickets.`);
        }

        const result = await this.ticketClassRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`TicketClass with ID ${id} not found.`);
        }
    }
}