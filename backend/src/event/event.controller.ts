/* backend/src/event/event.controller.ts */
import {
    Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors,
    UploadedFile, BadRequestException, Res, ParseIntPipe, HttpStatus,
    HttpCode, Req, UsePipes, ValidationPipe, Put, NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from "./event.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Role } from "../user/enums/role.enum";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { Event } from "./entities/event.entity";
import { Response } from 'express';
import { User } from "../user/entities/user.entity";

@Controller('events')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    /**
     * Tạo Event mới (Chỉ Admin)
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(FileInterceptor('thumbnail'))
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async create(
        @Body() createEventDto: CreateEventDto,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Partial<Event>> {
        if (!file) {
            throw new BadRequestException('Thumbnail image is required.');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid thumbnail file type.');
        }

        const createdEvent = await this.eventService.create(createEventDto, file.buffer);

        // Trả về thông tin cơ bản
        const { thumbnail, staffs, ...result } = createdEvent;
        return result;
    }

    /**
     * Lấy danh sách Event (cơ bản, public)
     */
    @Get()
    async findAllBasic(): Promise<Partial<Event>[]> {
        return this.eventService.findAllBasic();
    }

    /**
     * Lấy chi tiết 1 Event (public)
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
        return this.eventService.findOne(id);
    }

    @Get(':id/tickets')
    async getEventTickets(@Param('id', ParseIntPipe) id: number): Promise<any> {
        return this.eventService.getAllTickets(id);
    }

    /**
     * Cập nhật Event (Chỉ Admin)
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(FileInterceptor('thumbnail'))
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true }))
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventDto: UpdateEventDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<Partial<Event>> {

        if (file) {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException('Invalid thumbnail file type.');
            }
        }

        const thumbnailBuffer = file ? file.buffer : undefined;
        const updatedEvent = await this.eventService.update(id, updateEventDto, thumbnailBuffer);

        const { thumbnail, staffs, ...result } = updatedEvent;
        return result;
    }

    /**
     * Xóa Event (Chỉ Admin)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.eventService.remove(id);
    }

    /**
     * Lấy thumbnail (public)
     */
    @Get(':id/thumbnail')
    async getThumbnail(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        try {
            const thumbnailBuffer = await this.eventService.getThumbnail(id);
            // TODO: Lưu mimetype của thumbnail khi upload
            res.setHeader('Content-Type', 'image/jpeg'); // Giả định
            res.send(thumbnailBuffer);
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(HttpStatus.NOT_FOUND).send({ message: error.message });
            } else {
                console.error("Error retrieving thumbnail:", error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error retrieving thumbnail' });
            }
        }
    }

    // --- Endpoints Quản lý Staff ---

    /**
     * Thêm Staff vào Event (Chỉ Admin)
     * POST /events/:id/staffs
     * Body: { "userId": 123 }
     */
    @Post(':id/staffs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async addStaff(
        @Param('id', ParseIntPipe) eventId: number,
        @Body('userName', ParseIntPipe) username: string,
    ): Promise<Partial<User>> {
        const user = await this.eventService.addStaff(eventId, username);
        const { password, ...result } = user; // Không trả về password
        return result;
    }

    /**
     * Xóa Staff khỏi Event (Chỉ Admin)
     * DELETE /events/:id/staffs/:userId
     */
    @Delete(':id/staffs/:userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async removeStaff(
        @Param('id', ParseIntPipe) eventId: number,
        @Body('userName', ParseIntPipe) username: string,
    ): Promise<Partial<User>> {
        const user = await this.eventService.removeStaff(eventId, username);
        const { password, ...result } = user;
        return result;
    }
}