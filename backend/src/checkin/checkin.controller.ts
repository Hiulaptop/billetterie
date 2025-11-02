import {
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
    ForbiddenException,
} from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('checkin')
export class CheckinController {
    constructor(private readonly checkinService: CheckinService) {}

    @Get(':ticketCode')
    async getTicketDetails(
        @Param('ticketCode') ticketCode: string,
        @Req() req: any,
    ) {
        const userId = req.user.userId;
        if (!userId) {
            throw new ForbiddenException('Authentication required');
        }
        return this.checkinService.getTicketDetails(ticketCode, userId);
    }

    @Post(':ticketCode/confirm')
    async confirmCheckin(
        @Param('ticketCode') ticketCode: string,
        @Req() req: any,
    ) {
        const userId = req.user.userId;
        if (!userId) {
            throw new ForbiddenException('Authentication required');
        }
        return this.checkinService.confirmCheckin(ticketCode, userId);
    }
}