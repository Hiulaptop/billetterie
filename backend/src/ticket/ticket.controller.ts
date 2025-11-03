import {Controller, Post, Body, UseGuards, Req, Get, ValidationPipe, BadRequestException} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/enums/role.enum';
import { CreateAdminTicketDto } from './dto/create-admin-ticket.dto';
import { User } from '../user/entities/user.entity';
import {Public} from "../auth/decorators/public.decorator";

@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    // // Endpoint cho Admin xuất vé trực tiếp
    // @Post('admin-issue')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    // async createAdminIssuedTickets(
    //     @Body(new ValidationPipe()) createDto: CreateAdminTicketDto,
    //     @Req() req: any,
    // ) {
    //     const adminUser = req.user as User;
    //     const tickets = await this.ticketService.createAdminIssuedTickets(
    //         createDto.eventId,
    //         createDto.ticketClassId,
    //         createDto.quantity,
    //         adminUser,
    //     );
    //
    //     const result = tickets.map(t => ({
    //         ticketCode: t.ticketCode,
    //         status: t.status
    //     }));
    //     return { issuedTickets: result };
    // }
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @Post('issue-direct')
    async issueTicketsDirectly(
        @Body() body: { showtimeId: number; quantity: number },
        @Req() req: any,
    ) {
        const { showtimeId, quantity } = body;
        const adminUser = req.user;

        if (!showtimeId || !quantity) {
            throw new BadRequestException('Thiếu showtimeId hoặc quantity');
        }

        const result = await this.ticketService.issueTicketsDirectly(
            showtimeId,
            quantity,
            adminUser,
        );

        return result;
    }



    @Get('find-by-email')
    @Public()
    async findTicketsByEmail(@Req() req: any): Promise<any> {
        const email = req.query.email;
        if (!email) {
            throw new BadRequestException('Email query parameter is required.');
        }
        const tickets = await this.ticketService.findTicketsByEmail(email);

        return tickets;
    }


}