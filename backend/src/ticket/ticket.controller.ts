import { Controller, Post, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/enums/role.enum';
import { CreateAdminTicketDto } from './dto/create-admin-ticket.dto';
import { User } from '../user/entities/user.entity';

@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    // Endpoint cho Admin xuất vé trực tiếp
    @Post('admin-issue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async createAdminIssuedTickets(
        @Body(new ValidationPipe()) createDto: CreateAdminTicketDto,
        @Req() req: any,
    ) {
        const adminUser = req.user as User;
        const tickets = await this.ticketService.createAdminIssuedTickets(
            createDto.eventId,
            createDto.ticketClassId,
            createDto.quantity,
            adminUser,
        );

        const result = tickets.map(t => ({
            ticketCode: t.ticketCode,
            status: t.status
        }));
        return { issuedTickets: result };
    }
}