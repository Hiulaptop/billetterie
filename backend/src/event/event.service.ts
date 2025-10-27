/* backend/src/event/event.service.ts */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
    ) {}

    async create(createEventDto: CreateEventDto, thumbnail: Buffer): Promise<Event> {
        const { title, description, shortkey } = createEventDto;

        // Kiểm tra shortkey đã tồn tại chưa
        const existingEvent = await this.eventRepository.findOne({ where: { shortkey } });
        if (existingEvent) {
            throw new BadRequestException(`Shortkey "${shortkey}" already exists.`);
        }

        const newEvent = this.eventRepository.create({
            title,
            description,
            shortkey: shortkey.toUpperCase(), // Lưu shortkey dạng chữ hoa
            thumbnail,
            // Các trường ticketClasses, showtimes, images, form sẽ được thêm/cập nhật sau
        });
        return this.eventRepository.save(newEvent);
    }

    async findAll(): Promise<Event[]> {
        return this.eventRepository.find({ relations: ['ticketClasses', 'showtimes', 'images', 'form', 'form.fields', 'form.fields.options'] });
    }

    async findOne(id: number): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ['ticketClasses', 'showtimes', 'images', 'form', 'form.fields', 'form.fields.options', 'tickets'] // Thêm tickets
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }

    // Service để lấy thumbnail
    async getThumbnail(id: number): Promise<Buffer> {
        const event = await this.eventRepository.findOne({ where: { id }, select: ['thumbnail'] });
        if (!event || !event.thumbnail) {
            throw new NotFoundException(`Thumbnail for Event with ID ${id} not found`);
        }
        return event.thumbnail;
    }

    async update(id: number, updateEventDto: UpdateEventDto, thumbnail?: Buffer): Promise<Event> {
        const event = await this.findOne(id); // Sử dụng findOne để kiểm tra tồn tại

        // Kiểm tra nếu shortkey được cập nhật và nó đã tồn tại ở event khác
        if (updateEventDto.shortkey) {
            const shortkeyUpper = updateEventDto.shortkey.toUpperCase();
            if(shortkeyUpper !== event.shortkey) {
                const existingEvent = await this.eventRepository.findOne({ where: { shortkey: shortkeyUpper } });
                if (existingEvent && existingEvent.id !== id) {
                    throw new BadRequestException(`Shortkey "${updateEventDto.shortkey}" already exists.`);
                }
                updateEventDto.shortkey = shortkeyUpper; // Cập nhật lại dto với chữ hoa
            } else {
                // Nếu shortkey giống nhau thì không cần cập nhật
                delete updateEventDto.shortkey;
            }
        }


        // Cập nhật các trường được cung cấp trong DTO
        Object.assign(event, updateEventDto);

        // Cập nhật thumbnail nếu có file mới được tải lên
        if (thumbnail) {
            event.thumbnail = thumbnail;
        }

        return this.eventRepository.save(event);
    }

    async remove(id: number): Promise<void> {
        const result = await this.eventRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
    }

    // Lấy tất cả events (có thể dùng lại findAll hoặc tạo hàm mới nếu cần filter khác)
    async getAllEvents(): Promise<Event[]> {
        // Có thể thêm phân trang, sắp xếp, filter ở đây nếu cần
        return this.eventRepository.find({
            select: ["id", "title", "description", "shortkey"] // Chỉ lấy các trường cơ bản cho list view
            // relations: [...] // Chỉ load relations nếu thực sự cần ở list view
        });
    }

}