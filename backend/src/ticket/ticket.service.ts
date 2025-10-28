import { Injectable, InternalServerErrorException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket, TicketStatus } from '../event/entities/ticket.entity';
import { TicketClass } from '../event/entities/ticketclass.entity';
import { Event } from '../event/entities/event.entity';
import { User } from '../user/entities/user.entity';
import * as crypto from 'crypto'; // Dùng crypto để tạo random alphabet


@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(TicketClass)
        private ticketClassRepository: Repository<TicketClass>,

        private dataSource: DataSource, // Inject DataSource để dùng transaction
    ) {}

    // Hàm tạo mã alphabet ngẫu nhiên
    private generateRandomCode(length: number): string {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length)
            .toUpperCase();
    }

    // Hàm tạo ticket code (cần shortkey)
    private async generateUniqueTicketCode(shortkey: string): Promise<string> {
        let ticketCode: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        if (!shortkey) {
            throw new InternalServerErrorException('Event shortkey is missing for code generation.');
        }

        while (!isUnique && attempts < maxAttempts) {
            const randomPart = this.generateRandomCode(10); // 10 ký tự alphabet
            ticketCode = `${shortkey.toUpperCase()}-${randomPart}`;

            const existingTicket = await this.ticketRepository.findOne({ where: { ticketCode } });
            if (!existingTicket) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new InternalServerErrorException('Could not generate a unique ticket code.');
        }
        return ticketCode!;
    }

    // Lấy Event (và shortkey)
    private async getEvent(eventId: number): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event || !event.shortkey) {
            throw new NotFoundException(`Event ${eventId} not found or missing shortkey.`);
        }
        return event;
    }

    // 1. Tạo vé CHỜ THANH TOÁN (cho luồng PayOS)
    async createPendingTickets(
        eventId: number,
        ticketClassId: number,
        quantity: number,
        user: User | null,
        formData: Record<string, any> | undefined,
        payosPaymentId: number,
    ): Promise<Ticket[]> {

        // Lấy Event để lấy shortkey
        const event = await this.getEvent(eventId);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const createdTickets: Ticket[] = [];
            for (let i = 0; i < quantity; i++) {
                const ticketCode = await this.generateUniqueTicketCode(event.shortkey!);

                const newTicket = this.ticketRepository.create({
                    ticketCode,
                    status: TicketStatus.PENDING_PAYMENT,
                    owner: user,
                    ownerId: user?.id ?? null,
                    ticketClassId: ticketClassId,
                    event: event, // Gán Event
                    eventId: event.id, // Gán Event ID
                    formData: formData,
                    customerName: formData?.customerName ?? user?.displayName,
                    customerEmail: formData?.customerEmail ?? user?.email,
                    payosPaymentId: payosPaymentId,
                });
                const savedTicket = await queryRunner.manager.save(newTicket);
                createdTickets.push(savedTicket);
            }

            await queryRunner.commitTransaction();
            return createdTickets;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error creating pending tickets:", error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('Duplicate entry, possibly duplicate PayOS order code.');
            }
            throw new InternalServerErrorException('Failed to create tickets.');
        } finally {
            await queryRunner.release();
        }
    }

    // 2. Cập nhật trạng thái vé (cho Webhook PayOS)
    async updateTicketStatusByPayOSId(payosPaymentId: number, newStatus: TicketStatus): Promise<Ticket[]> {
        const tickets = await this.ticketRepository.find({ where: { payosPaymentId } });
        if (!tickets || tickets.length === 0) {
            console.warn(`No tickets found for PayOS Payment ID: ${payosPaymentId}`);
            return [];
        }

        const updatedTickets: Ticket[] = [];
        for (const ticket of tickets) {
            if (ticket.status === TicketStatus.PENDING_PAYMENT) {
                ticket.status = newStatus;
                await this.ticketRepository.save(ticket);
                updatedTickets.push(ticket);
            } else {
                console.warn(`Ticket ${ticket.ticketCode} status is ${ticket.status}, skipping update.`);
            }
        }
        return updatedTickets;
    }

    // 3. Tạo vé cho Admin (trạng thái ĐÃ THANH TOÁN)
    async createAdminIssuedTickets(
        eventId: number,
        ticketClassId: number,
        quantity: number,
        adminUser: User,
    ): Promise<Ticket[]> {

        // Lấy Event để lấy shortkey
        const event = await this.getEvent(eventId);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const createdTickets: Ticket[] = [];
            for (let i = 0; i < quantity; i++) {
                const ticketCode = await this.generateUniqueTicketCode(event.shortkey!);
                const newTicket = this.ticketRepository.create({
                    ticketCode,
                    status: TicketStatus.PAID, // Trạng thái "đã thanh toán chờ checkin"
                    owner: null,
                    ownerId: null,
                    ticketClassId: ticketClassId,
                    event: event, // Gán Event
                    eventId: event.id, // Gán Event ID
                    formData: { issuedBy: adminUser.username },
                    payosPaymentId: null,
                });
                const savedTicket = await queryRunner.manager.save(newTicket);
                createdTickets.push(savedTicket);
            }

            await queryRunner.commitTransaction();
            return createdTickets;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error creating admin issued tickets:", error);
            throw new InternalServerErrorException('Failed to issue tickets.');
        } finally {
            await queryRunner.release();
        }
    }

    // Hàm tìm vé (cho trang success)
    async findTicketsByPayOSId(payosPaymentId: number): Promise<Ticket[]> {
        return this.ticketRepository.find({
            where: { payosPaymentId },
            // Load cả event và ticketClass (vì ticketClass eager: true)
            relations: ['event', 'ticketClass'],
        });
    }
}