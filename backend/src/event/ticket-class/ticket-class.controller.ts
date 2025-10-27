/* backend/src/event/ticket-class/ticket-class.controller.ts */
import {
    Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,
    UseGuards, ValidationPipe, HttpCode, HttpStatus, Query, UsePipes
} from '@nestjs/common';
import { TicketClassService } from './ticket-class.service';
import { CreateTicketClassDto } from './dto/create-ticket-class.dto';
import { UpdateTicketClassDto } from './dto/update-ticket-class.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../user/enums/role.enum';
import { TicketClass } from '../entities/ticketclass.entity';

@Controller('ticket-classes')
@UseGuards(JwtAuthGuard, RolesGuard) // Bảo vệ tất cả
export class TicketClassController {
    constructor(private readonly ticketClassService: TicketClassService) {}

    @Post()
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    create(@Body() createDto: CreateTicketClassDto): Promise<TicketClass> {
        return this.ticketClassService.create(createDto);
    }

    // Lấy ticket-classes theo showtime (Public - cho phép User)
    @Get()
    @Roles(Role.Admin, Role.Staff, Role.User) // Mở cho User
    findAllByShowtime(@Query('showtimeId', ParseIntPipe) showtimeId: number): Promise<TicketClass[]> {
        return this.ticketClassService.findAllByShowtime(showtimeId);
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Staff, Role.User) // Mở cho User
    findOne(@Param('id', ParseIntPipe) id: number): Promise<TicketClass> {
        return this.ticketClassService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true, skipMissingProperties: true }))
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateTicketClassDto): Promise<TicketClass> {
        return this.ticketClassService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.ticketClassService.remove(id);
    }
}