import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from '../event/entities/ticket.entity';
import { Repository } from 'typeorm';
import { TicketStatus } from "../event/entities/ticket.entity";
import { UserService } from "../user/user.service";

@Injectable()
export class CheckinService {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        private userService: UserService,
    ) {}

    private async getTicketAndVerifyPermission(
        ticketCode: string,
        userId: string,
    ): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { ticketCode },
            relations: [
                'event',
                'ticketClass',
            ],
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }
        const user = await this.userService.findOneById(parseInt(userId, 10));
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if(user.role === 'admin'){
            return ticket;
        }


        // Yêu cầu: "chỉ cho các user đã đăng nhập và được add vào event"
        // Ở đây, tôi giả định "được add vào event" nghĩa là "là người tạo event"
        // Nếu bạn có logic khác (ví dụ: bảng "EventStaff"), bạn cần cập nhật logic này
        if (!ticket.event.staffs.find(staff => staff.id === parseInt(userId,10) )) {
            throw new ForbiddenException('You do not have permission to access this ticket');
        }

        return ticket;
    }

    async getTicketDetails(ticketCode: string, userId: string) {
        const ticket = await this.getTicketAndVerifyPermission(ticketCode, userId);
        // Xóa thông tin nhạy cảm trước khi trả về (nếu cần)
        // delete ticket.event.staffs;
        return ticket;
    }

    async confirmCheckin(ticketCode: string, userId: string) {
        const ticket = await this.getTicketAndVerifyPermission(ticketCode, userId);

        if (ticket.status === TicketStatus.CHECKED_IN) {
            throw new BadRequestException('Ticket already checked in');
        }

        if (ticket.status !== TicketStatus.PAID) {
            throw new BadRequestException('Ticket is not paid or has been cancelled');
        }

        ticket.status = TicketStatus.CHECKED_IN;
        await this.ticketRepository.save(ticket);
        return ticket;
    }
}