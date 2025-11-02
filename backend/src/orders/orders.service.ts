import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketClass } from '../event/entities/ticketclass.entity';
import { Event } from '../event/entities/event.entity'; // Import Event
import { TicketService } from '../ticket/ticket.service';
import { PayosService } from '../payos/payos.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import {TicketStatus} from "../event/entities/ticket.entity";

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(TicketClass)
        private ticketClassRepository: Repository<TicketClass>,
        @InjectRepository(Event) // Inject Event
        private eventRepository: Repository<Event>,
        private readonly ticketService: TicketService,
        private readonly payosService: PayosService,
        private readonly configService: ConfigService,
    ) {}

    async createPaymentLink(createOrderDto: CreateOrderDto, user: User | null): Promise<{ checkoutUrl: string; paymentId: number }> {
        const { eventId, showtimeId, ticketClassId, quantity, formData } = createOrderDto;

        // 1. Validate Event
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new NotFoundException(`Event ${eventId} not found.`);
        }

        // 2. Validate TicketClass
        const ticketClass = await this.ticketClassRepository.findOne({
            where: {
                id: ticketClassId,
                showtime: { id: showtimeId },
                event: { id: eventId }
            }
        });

        if (!ticketClass) {
            throw new NotFoundException(`TicketClass ${ticketClassId} not found or doesn't match event/showtime.`);
        }
        if (!ticketClass.isActive) {
            throw new BadRequestException(`Ticket class "${ticketClass.name}" is not active.`);
        }

        // 3. Tính tổng tiền
        const totalAmount = ticketClass.price * quantity;
        if (totalAmount <= 0) {
            throw new BadRequestException('Total amount must be greater than zero.');
        }

        // 4. Tạo order code
        const orderCode = parseInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10), 10);

        // 5. Tạo vé PENDING (Truyền eventId và ticketClassId)
        const pendingTickets = await this.ticketService.createPendingTickets(
            eventId, ticketClassId, quantity, user, formData, orderCode
        );

        if (!pendingTickets || pendingTickets.length === 0) {
            throw new InternalServerErrorException('Failed to create pending tickets.');
        }

        const descriptionTicketCode = pendingTickets[0].ticketCode;

        // 6. Gọi PayOS
        const paymentData = {
            orderCode: orderCode,
            amount: totalAmount,
            description: descriptionTicketCode,
            buyerName: formData?.customerName ?? user?.displayName ?? 'Guest',
            buyerEmail: formData?.customerEmail ?? user?.email ?? undefined,
            items: [{
                name: `${event.title} - ${ticketClass.name}`,
                quantity: quantity,
                price: Number(ticketClass.price),
            }],
            cancelUrl: `${this.configService.get<string>('FRONTEND_URL')}/payment/failed?orderCode=${orderCode}`,
            returnUrl: `${this.configService.get<string>('FRONTEND_URL')}/payment/success`,
        };

        try {
            const paymentLinkResponse = await this.payosService.payos.paymentRequests.create(paymentData);
            return {
                checkoutUrl: paymentLinkResponse.checkoutUrl,
                paymentId: orderCode
            };
        } catch (payosError: any) {
            console.error('PayOS createPaymentLink error:', payosError?.message || payosError);
            await this.ticketService.updateTicketStatusByPayOSId(orderCode, TicketStatus.CANCELLED);
            throw new InternalServerErrorException('Failed to create payment link with PayOS.');
        }
    }

    async handleSuccessfulPayment(payosOrderCode: number): Promise<void> {
        const updatedTickets = await this.ticketService.updateTicketStatusByPayOSId(payosOrderCode, TicketStatus.PAID);

        if (updatedTickets.length === 0) {
            console.warn(`No tickets updated for successful payment with PayOS Order Code: ${payosOrderCode}`);
        } else {
            console.log(`Updated ${updatedTickets.length} tickets to PAID for PayOS Order Code: ${payosOrderCode}`);
        }
    }

    // Lấy thông tin order (cho trang success)
    async getOrderConfirmation(payosOrderCode: number, user: User | null): Promise<any> {
        const tickets = await this.ticketService.findTicketsByPayOSId(payosOrderCode);

        if (!tickets || tickets.length === 0) {
            throw new NotFoundException(`Order with code ${payosOrderCode} not found.`);
        }

        const firstTicket = tickets[0];
        // Xác thực user (nếu vé có owner)
        if (user && firstTicket.ownerId && firstTicket.ownerId !== user.id) {
            throw new NotFoundException('Order not found for this user.');
        }

        return {
            tickets: tickets.map(t => ({
                ticketCode: t.ticketCode,
                status: t.status,
                ticketClass: t.ticketClass.name,
            })),
            orderId: payosOrderCode,
            formData: firstTicket.formData,
            eventTitle: firstTicket.event.title, // Lấy từ quan hệ event trực tiếp
        };
    }
}