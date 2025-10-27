/* backend/src/event/event.service.ts */
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service'; // Import UserService

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private userService: UserService, // Inject UserService
    ) {}

    /**
     * Tạo Event mới (Chỉ Admin)
     */
    async create(createEventDto: CreateEventDto, thumbnail: Buffer): Promise<Event> {
        const { shortkey, ...restDto } = createEventDto;

        const existingEvent = await this.eventRepository.findOne({ where: { shortkey } });
        if (existingEvent) {
            throw new ConflictException(`Shortkey "${shortkey}" already exists.`);
        }

        const newEvent = this.eventRepository.create({
            ...restDto,
            shortkey,
            thumbnail,
            // staffs sẽ được thêm sau
        });

        try {
            return await this.eventRepository.save(newEvent);
        } catch (error) {
            console.error("Error saving event:", error);
            throw new InternalServerErrorException('Failed to create event.');
        }
    }

    /**
     * Lấy danh sách Event (cơ bản, public)
     */
    async findAllBasic(): Promise<Partial<Event>[]> {
        return this.eventRepository.find({
            select: ["id", "title", "description", "shortkey", "createdAt"],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Lấy chi tiết 1 Event (public)
     */
    async findOne(id: number): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: [
                'showtimes',
                // 'ticketClasses', // Thường ticketClasses được lấy theo showtime
                'images',
                'form',
                'form.fields',
                'form.fields.options',
                'staffs', // Lấy danh sách staffs
                // 'tickets' // Không nên load tất cả vé ở đây
            ],
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }

    /**
     * Lấy thumbnail của Event (public)
     */
    async getThumbnail(id: number): Promise<Buffer> {
        const event = await this.eventRepository.findOne({ where: { id }, select: ['id', 'thumbnail'] });
        if (!event || !event.thumbnail) {
            throw new NotFoundException(`Event with ID ${id} not found or has no thumbnail`);
        }
        return event.thumbnail;
    }

    /**
     * Cập nhật Event (Chỉ Admin)
     */
    async update(id: number, updateEventDto: UpdateEventDto, thumbnail?: Buffer): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        if (updateEventDto.shortkey && updateEventDto.shortkey !== event.shortkey) {
            const existingEvent = await this.eventRepository.findOne({ where: { shortkey: updateEventDto.shortkey } });
            if (existingEvent) {
                throw new ConflictException(`Shortkey "${updateEventDto.shortkey}" already exists.`);
            }
        }

        this.eventRepository.merge(event, updateEventDto);

        if (thumbnail) {
            event.thumbnail = thumbnail;
        }

        try {
            return await this.eventRepository.save(event);
        } catch (error) {
            console.error("Error updating event:", error);
            throw new InternalServerErrorException('Failed to update event.');
        }
    }

    /**
     * Xóa Event (Chỉ Admin)
     */
    async remove(id: number): Promise<void> {
        // User (staff) sẽ tự động set staff_event = null nhờ onDelete: 'SET NULL'
        const result = await this.eventRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
    }

    // --- Quản lý Staff ---

    /**
     * Thêm Staff vào Event (Chỉ Admin)
     */
    async addStaff(eventId: number, userName: string): Promise<User> {
        const event = await this.findOne(eventId); // Check event
        const user = await this.userService.findOneByUsername(userName); // Dùng UserService
        if (!user) {
            throw new NotFoundException(`User with ID ${userName} not found.`);
        }

        if (user.staff_event && user.staff_event.id !== event.id) {
            throw new ConflictException(`User ${user.username} is already staff for another event (ID: ${user.staff_event.id}).`);
        }

        if (user.staff_event && user.staff_event.id === event.id) {
            return user; // Đã là staff
        }

        user.staff_event = event;
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            console.error(`Error adding staff ${user.username} to event ${eventId}:`, error);
            throw new InternalServerErrorException('Failed to add staff.');
        }
    }

    /**
     * Xóa Staff khỏi Event (Chỉ Admin)
     */
    async removeStaff(eventId: number, userName: string): Promise<User> {
        const event = await this.findOne(eventId); // Check event
        const user = await this.userService.findOneByUsername(userName); // Tìm user
        if (!user) {
            throw new NotFoundException(`User with ID ${userName} not found.`);
        }

        if (!user.staff_event || user.staff_event.id !== event.id) {
            throw new BadRequestException(`User ${user.username} is not staff for this event.`);
        }

        user.staff_event = null;
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            console.error(`Error removing staff ${user.username} from event ${eventId}:`, error);
            throw new InternalServerErrorException('Failed to remove staff.');
        }
    }
}