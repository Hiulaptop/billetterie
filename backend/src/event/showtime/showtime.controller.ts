/* backend/src/event/showtime/showtime.controller.ts */
import {
    Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,
    UseGuards, ValidationPipe, HttpCode, HttpStatus, Query, UsePipes
} from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../user/enums/role.enum';
import { Showtime } from '../entities/showtime.entity';

@Controller('showtimes')
@UseGuards(JwtAuthGuard, RolesGuard) // Bảo vệ tất cả
export class ShowtimeController {
    constructor(private readonly showtimeService: ShowtimeService) {}

    @Post()
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    create(@Body() createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
        return this.showtimeService.create(createShowtimeDto);
    }

    // Lấy showtimes theo event (Public - cho phép User)
    @Get()
    @Roles(Role.Admin, Role.Staff, Role.User) // Mở cho User
    findAllByEvent(@Query('eventId', ParseIntPipe) eventId: number): Promise<Showtime[]> {
        return this.showtimeService.findAllByEvent(eventId);
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Staff, Role.User) // Mở cho User
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Showtime> {
        return this.showtimeService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true, skipMissingProperties: true }))
    update(@Param('id', ParseIntPipe) id: number, @Body() updateShowtimeDto: UpdateShowtimeDto): Promise<Showtime> {
        return this.showtimeService.update(id, updateShowtimeDto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.showtimeService.remove(id);
    }
}