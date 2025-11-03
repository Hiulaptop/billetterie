import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketClass } from '../event/entities/ticketclass.entity';
import { Event } from '../event/entities/event.entity';
import { TicketService } from '../ticket/ticket.service';
import { PayosService } from '../payos/payos.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { TicketStatus } from '../event/entities/ticket.entity';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(TicketClass)
        private ticketClassRepository: Repository<TicketClass>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        private readonly ticketService: TicketService,
        private readonly payosService: PayosService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Tạo liên kết thanh toán PayOS
     * - Tạo vé pending (ticketService sẽ trừ số vé)
     * - Nếu tạo link PayOS thất bại => huỷ pending và hoàn vé lại
     */
    async createPaymentLink(
        createOrderDto: CreateOrderDto,
        user: User | null,
    ): Promise<{ checkoutUrl: string; paymentId: number }> {
        const {
            eventId,
            showtimeId,
            ticketClassId,
            quantity,
            formData,
            customerName,
            customerEmail,
        } = createOrderDto;

        // 1. Validate bắt buộc
        if (!customerName?.trim() || !customerEmail?.trim()) {
            throw new BadRequestException('Thiếu họ tên hoặc email người mua vé.');
        }
        if (!quantity || quantity <= 0) {
            throw new BadRequestException('Số lượng vé phải lớn hơn 0.');
        }

        // 2. Kiểm tra Event
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) throw new NotFoundException(`Không tìm thấy sự kiện ID=${eventId}`);

        // 3. Kiểm tra TicketClass (lấy giá và kiểm tra trạng thái)
        const ticketClass = await this.ticketClassRepository.findOne({
            where: { id: ticketClassId },
            relations: ['showtime', 'event'],
        });
        if (!ticketClass) {
            throw new NotFoundException(
                `Không tìm thấy loại vé ID=${ticketClassId}.`,
            );
        }
        // ensure the ticketClass belongs to the event & showtime (if provided)
        if (ticketClass.event?.id !== eventId) {
            throw new BadRequestException('TicketClass không thuộc event cung cấp.');
        }
        if (showtimeId && ticketClass.showtime?.id !== showtimeId) {
            throw new BadRequestException('TicketClass không thuộc showtime cung cấp.');
        }

        if (!ticketClass.isActive) {
            throw new BadRequestException(`Loại vé "${ticketClass.name}" hiện không khả dụng.`);
        }

        // 4. Tính tổng tiền (price có thể là decimal string — convert to Number)
        const priceNumber = Number(ticketClass.price);
        const totalAmount = priceNumber * quantity;
        if (isNaN(totalAmount) || totalAmount <= 0) {
            throw new BadRequestException('Giá trị đơn hàng phải lớn hơn 0.');
        }

        // 5. Sinh mã order (sử dụng số nguyên)
        const orderCode = parseInt(
            `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10),
            10,
        );

        // 6. Tạo vé PENDING (ticketService sẽ handle transaction & giảm quantity)
        let pendingTickets;
        try {
            pendingTickets = await this.ticketService.createPendingTickets(
                eventId,
                ticketClassId,
                quantity,
                user,
                customerName,
                customerEmail,
                formData,
                orderCode,
            );
        } catch (err) {
            this.logger.error('Failed to create pending tickets', err);
            // nếu tạo pending vé thất bại, trả lỗi cho client
            throw err;
        }

        if (!pendingTickets?.length) {
            // an unexpected case
            throw new InternalServerErrorException('Không thể tạo vé pending.');
        }

        const descriptionTicketCode = pendingTickets[0].ticketCode;

        // 7. Chuẩn bị dữ liệu gọi PayOS
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || process.env.NEXT_PUBLIC_FRONTEND_URL;
        const paymentData = {
            orderCode,
            amount: totalAmount,
            description: descriptionTicketCode,
            buyerName: customerName,
            buyerEmail: customerEmail,
            items: [
                {
                    name: `${event.title} - ${ticketClass.name}`,
                    quantity,
                    price: priceNumber,
                },
            ],
            cancelUrl: `${frontendUrl}/payment/failed?orderCode=${orderCode}`,
            returnUrl: `${frontendUrl}/payment/success?orderCode=${orderCode}`,
        };

        // 8. Gọi PayOS tạo link thanh toán
        try {
            const paymentLinkResponse =
                await this.payosService.payos.paymentRequests.create(paymentData);

            // Hãy kiểm tra cấu trúc response tùy PayOS SDK của bạn; ở đây giữ giống cũ
            return {
                checkoutUrl: paymentLinkResponse.checkoutUrl,
                paymentId: orderCode,
            };
        } catch (err: any) {
            this.logger.error('PayOS createPaymentLink error:', err?.message || err);

            // rollback: huỷ các pending tickets tạo bởi orderCode và restore số vé
            try {
                await this.ticketService.cancelPendingTickets(orderCode);
            } catch (rollbackErr) {
                this.logger.error('Failed to rollback pending tickets after PayOS error', rollbackErr);
            }

            throw new InternalServerErrorException(
                'Không thể tạo liên kết thanh toán với PayOS.',
            );
        }
    }

    /** PayOS báo thanh toán thành công */
    async handleSuccessfulPayment(payosOrderCode: number): Promise<void> {
        const updatedTickets = await this.ticketService.updateTicketStatusByPayOSId(
            payosOrderCode,
            TicketStatus.PAID,
        );

        if (!updatedTickets.length) {
            this.logger.warn(`Không tìm thấy vé cho PayOS OrderCode=${payosOrderCode}`);
        } else {
            this.logger.log(`Đã cập nhật ${updatedTickets.length} vé sang trạng thái PAID.`);
        }
    }

    /** Trang xác nhận thanh toán (dùng trên frontend) */
    async getOrderConfirmation(payosOrderCode: number, user: User | null): Promise<any> {
        const tickets = await this.ticketService.findTicketsByPayOSId(payosOrderCode);
        if (!tickets?.length)
            throw new NotFoundException(`Không tìm thấy đơn hàng ${payosOrderCode}.`);

        const firstTicket = tickets[0];
        if (user && firstTicket.ownerId && firstTicket.ownerId !== user.id)
            throw new NotFoundException('Đơn hàng không thuộc về người dùng này.');

        return {
            tickets: tickets.map(t => ({
                ticketCode: t.ticketCode,
                status: t.status,
                ticketClass: t.ticketClass?.name,
                customerName: t.customerName,
                customerEmail: t.customerEmail,
            })),
            orderId: payosOrderCode,
            eventTitle: firstTicket.event?.title,
            formData: firstTicket.formData,
        };
    }

    /** Webhook từ PayOS */
    async handlePayosHook(payload: any) {
        const { orderCode, status, code } = payload;
        this.logger.log('Processing PayOS hook', JSON.stringify(payload));

        if (!orderCode) throw new Error('Thiếu orderCode trong payload');

        // consider code === '00' or status 'PAID' as success (tùy PayOS)
        if (code === '00' || status === 'PAID') {
            this.logger.log(`Thanh toán thành công cho orderCode=${orderCode}`);
            await this.handleSuccessfulPayment(Number(orderCode));
        } else {
            this.logger.warn(`Thanh toán KHÔNG thành công cho orderCode=${orderCode}: ${status}`);
            // rollback: cancel pending tickets and restore quantities
            try {
                await this.ticketService.cancelPendingTickets(Number(orderCode));
            } catch (err) {
                this.logger.error('Failed to cancel pending tickets on failed payment webhook', err);
            }
        }

        return { success: true, message: 'Hook xử lý thành công' };
    }
}
