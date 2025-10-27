import {
    Controller,
    Get,
    Put,
    Delete,
    ValidationPipe,
    UsePipes,
    Param,
    Body,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res,
    NotFoundException,
    ParseIntPipe,
    HttpStatus,
    HttpCode,
} from "@nestjs/common";
import * as fastify from 'fastify';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from "./event.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../auth/guards/roles.guard";
import {Role} from "../user/enums/role.enum";
import {Roles} from "../auth/decorators/roles.decorator";
import {CreateEventDto} from "./dto/create-event.dto";
import {UpdateEventDto} from "./dto/update-event.dto";
import { Event } from "./entities/event.entity";
import {Query} from "typeorm/driver/Query";

@Controller('events')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(FileInterceptor('thumbnail'))
    async create(
        @Body() createEventDto: CreateEventDto,
        @UploadedFile() file: Express.Multer.File,
    ){
        if (!file){
            throw new BadRequestException('Thumbnail image is required.');
        }

        // const event = await this.eventsService.create(createEventDto, file.buffer);
        // const { thumbnail, ...result } = event;
        // return result;
        return this.eventService.create(createEventDto, file.buffer);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('thumbnail')) // Cho phép upload thumbnail khi update
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true })) // Validate DTO, bỏ qua field thiếu
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventDto: UpdateEventDto,
        @UploadedFile() file?: Express.Multer.File, // Thumbnail là optional khi update
    ): Promise<Event> {
        const thumbnailBuffer = file ? file.buffer : undefined;
        return this.eventService.update(id, updateEventDto, thumbnailBuffer);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Trả về 204 No Content khi xóa thành công
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.eventService.remove(id);
    }

    @Get()
    findAll(): Promise<Event[]> {
        return this.eventService.getAllEvents()
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
        return this.eventService.findOne(id);
    }


    @Get(':id/thumbnail')
    async getThumbnail(
        @Param('id', ParseIntPipe) id: number,
        // 2. Use the type from the namespace:
        @Res() res: fastify.FastifyReply, // <-- Use the namespace here
    ) {
        try {
            const thumbnailBuffer = await this.eventService.getThumbnail(id);
            // Thiết lập header Content-Type phù hợp (ví dụ: image/jpeg, image/png)
            // Cần có cơ chế xác định mimetype khi lưu ảnh hoặc lưu mimetype vào db
            res.header('Content-Type', 'image/jpeg'); // Giả sử là jpeg, bạn cần điều chỉnh
            res.send(thumbnailBuffer);
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(HttpStatus.NOT_FOUND).send(error.message);
            } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error retrieving thumbnail');
            }
        }
    }
}

// params