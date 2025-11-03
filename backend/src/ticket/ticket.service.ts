import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket, TicketStatus } from '../event/entities/ticket.entity';
import { TicketClass } from '../event/entities/ticketclass.entity';
import { Event } from '../event/entities/event.entity';
import { User } from '../user/entities/user.entity';
import * as crypto from 'crypto';
import { ShowtimeService } from '../event/showtime/showtime.service';

@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(TicketClass)
        private ticketClassRepository: Repository<TicketClass>,
        private readonly showtimeService: ShowtimeService,
        private dataSource: DataSource,
    ) {}

    private generateRandomCode(length: number): string {
        return crypto
            .randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length)
            .toUpperCase();
    }

    private async generateUniqueTicketCode(shortkey: string): Promise<string> {
        let ticketCode: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        if (!shortkey) {
            throw new InternalServerErrorException(
                'Event shortkey is missing for code generation.',
            );
        }

        while (!isUnique && attempts < maxAttempts) {
            const randomPart = this.generateRandomCode(10);
            ticketCode = `${shortkey.toUpperCase()}-${randomPart}`;

            const existing = await this.ticketRepository.findOne({
                where: { ticketCode },
            });
            if (!existing) isUnique = true;
            attempts++;
        }

        if (!isUnique) {
            throw new InternalServerErrorException(
                'Could not generate a unique ticket code.',
            );
        }
        return ticketCode!;
    }

    private async getEvent(eventId: number): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event || !event.shortkey) {
            throw new NotFoundException(
                `Event ${eventId} not found or missing shortkey.`,
            );
        }
        return event;
    }

    /**
     * Tạo tickets PENDING và đồng thời trừ quantity trên TicketClass (nếu có giới hạn).
     * Dùng transaction + pessimistic lock để tránh oversell.
     */
    async createPendingTickets(
        eventId: number,
        ticketClassId: number,
        quantity: number,
        user: User | null,
        customerName: string,
        customerEmail: string,
        formData: Record<string, any> | undefined,
        payosPaymentId: number,
    ): Promise<Ticket[]> {
        if (!customerName?.trim() || !customerEmail?.trim()) {
            throw new BadRequestException(
                'Thiếu họ tên hoặc email người mua vé.',
            );
        }
        if (quantity <= 0) {
            throw new BadRequestException('Số lượng phải lớn hơn 0.');
        }

        const event = await this.getEvent(eventId);
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock the ticket class row to prevent concurrent oversell
            const lockedTicketClass = await queryRunner.manager
                .createQueryBuilder(TicketClass, 'tc')
                .setLock('pessimistic_write')
                .where('tc.id = :id', { id: ticketClassId })
                .getOne();

            if (!lockedTicketClass) {
                throw new NotFoundException('Không tìm thấy loại vé.');
            }

            // If quantity is null -> unlimited, otherwise check availability
            if (
                lockedTicketClass.quantity !== null &&
                lockedTicketClass.quantity < quantity
            ) {
                throw new BadRequestException(
                    `Chỉ còn ${lockedTicketClass.quantity} vé khả dụng.`,
                );
            }

            // Subtract
            if (lockedTicketClass.quantity !== null) {
                lockedTicketClass.quantity = lockedTicketClass.quantity - quantity;
                if (lockedTicketClass.quantity < 0) lockedTicketClass.quantity = 0;
                await queryRunner.manager.save(lockedTicketClass);
            }

            const created: Ticket[] = [];
            for (let i = 0; i < quantity; i++) {
                const code = await this.generateUniqueTicketCode(event.shortkey!);

                const ticket = this.ticketRepository.create({
                    ticketCode: code,
                    status: TicketStatus.PENDING_PAYMENT,
                    owner: user,
                    ownerId: user?.id ?? null,
                    ticketClassId,
                    event,
                    eventId: event.id,
                    customerName,
                    customerEmail,
                    formData,
                    payosPaymentId,
                });

                const saved = await queryRunner.manager.save(ticket);
                created.push(saved);
            }

            await queryRunner.commitTransaction();
            return created;
        } catch (err: any) {
            await queryRunner.rollbackTransaction();
            console.error('Error creating pending tickets:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                throw new ConflictException(
                    'Duplicate entry, possibly duplicate code or order.',
                );
            }
            // Re-throw known exceptions
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }
            throw new InternalServerErrorException('Failed to create tickets.');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Restore (tăng) số lượng cho 1 ticket class.
     * Dùng transaction + pessimistic lock để an toàn.
     */
    async restoreTicketQuantity(ticketClassId: number, quantity: number): Promise<void> {
        if (quantity <= 0) return;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const lockedTicketClass = await queryRunner.manager
                .createQueryBuilder(TicketClass, 'tc')
                .setLock('pessimistic_write')
                .where('tc.id = :id', { id: ticketClassId })
                .getOne();

            if (!lockedTicketClass) {
                throw new NotFoundException('Không tìm thấy loại vé để hoàn số lượng.');
            }

            // If quantity column is null => unlimited => nothing to restore
            if (lockedTicketClass.quantity !== null) {
                lockedTicketClass.quantity = (lockedTicketClass.quantity ?? 0) + quantity;
                await queryRunner.manager.save(lockedTicketClass);
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error restoring ticket quantity:', err);
            throw new InternalServerErrorException('Không thể hoàn lại số lượng vé.');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Huỷ tất cả ticket PENDING cho một payosPaymentId: set status -> CANCELLED
     * và hoàn lại số lượng tương ứng.
     */
    async cancelPendingTickets(payosPaymentId: number): Promise<{ cancelled: number }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Tìm các vé PENDING thuộc payosPaymentId (không lock ở đây vì sẽ lock ticketClass khi restore)
            const tickets = await queryRunner.manager.find(Ticket, {
                where: { payosPaymentId, status: TicketStatus.PENDING_PAYMENT },
            });

            if (!tickets || tickets.length === 0) {
                await queryRunner.commitTransaction();
                return { cancelled: 0 };
            }

            // Group by ticketClassId để restore đúng lượng
            const countsByClass = tickets.reduce<Record<number, number>>((acc, t) => {
                const tcId = t.ticketClassId as number;
                acc[tcId] = (acc[tcId] || 0) + 1;
                return acc;
            }, {});

            // Update ticket statuses to CANCELLED
            for (const t of tickets) {
                t.status = TicketStatus.CANCELLED;
                await queryRunner.manager.save(t);
            }

            // Restore quantities per ticketClass
            for (const [tcIdStr, cnt] of Object.entries(countsByClass)) {
                const tcId = Number(tcIdStr);
                const lockedTicketClass = await queryRunner.manager
                    .createQueryBuilder(TicketClass, 'tc')
                    .setLock('pessimistic_write')
                    .where('tc.id = :id', { id: tcId })
                    .getOne();

                if (!lockedTicketClass) {
                    // log and continue (shouldn't normally happen)
                    console.warn(`TicketClass ${tcId} not found when restoring after cancel.`);
                    continue;
                }
                if (lockedTicketClass.quantity !== null) {
                    lockedTicketClass.quantity = (lockedTicketClass.quantity ?? 0) + cnt;
                    await queryRunner.manager.save(lockedTicketClass);
                }
            }

            await queryRunner.commitTransaction();
            return { cancelled: tickets.length };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error cancelling pending tickets:', err);
            throw new InternalServerErrorException('Không thể huỷ vé tạm thời.');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Cập nhật trạng thái vé theo payosPaymentId
     * Nếu newStatus là CANCELLED thì sẽ thực hiện restore số lượng tương ứng.
     */
    async updateTicketStatusByPayOSId(
        payosPaymentId: number,
        newStatus: TicketStatus,
    ): Promise<Ticket[]> {
        const tickets = await this.ticketRepository.find({ where: { payosPaymentId } });
        if (!tickets || tickets.length === 0) {
            console.warn(`No tickets found for PayOS Payment ID: ${payosPaymentId}`);
            return [];
        }

        // Nếu chuyển đến CANCELLED hoặc FAILED => restore quantities for PENDING tickets
        if (
            newStatus === TicketStatus.CANCELLED
        ) {
            // only consider tickets that are still PENDING_PAYMENT
            const pending = tickets.filter(t => t.status === TicketStatus.PENDING_PAYMENT);
            if (pending.length > 0) {
                // group by ticketClassId
                const countsByClass = pending.reduce<Record<number, number>>((acc, t) => {
                    const tcId = t.ticketClassId as number;
                    acc[tcId] = (acc[tcId] || 0) + 1;
                    return acc;
                }, {});

                // restore in a single transaction
                const queryRunner = this.dataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
                try {
                    // update statuses
                    for (const t of pending) {
                        t.status = newStatus;
                        await queryRunner.manager.save(t);
                    }

                    // restore quantities
                    for (const [tcIdStr, cnt] of Object.entries(countsByClass)) {
                        const tcId = Number(tcIdStr);
                        const lockedTicketClass = await queryRunner.manager
                            .createQueryBuilder(TicketClass, 'tc')
                            .setLock('pessimistic_write')
                            .where('tc.id = :id', { id: tcId })
                            .getOne();

                        if (!lockedTicketClass) {
                            console.warn(`TicketClass ${tcId} not found during restore.`);
                            continue;
                        }

                        if (lockedTicketClass.quantity !== null) {
                            lockedTicketClass.quantity = (lockedTicketClass.quantity ?? 0) + cnt;
                            await queryRunner.manager.save(lockedTicketClass);
                        }
                    }

                    await queryRunner.commitTransaction();
                } catch (err) {
                    await queryRunner.rollbackTransaction();
                    console.error('Error restoring quantities while cancelling:', err);
                    throw new InternalServerErrorException('Không thể cập nhật trạng thái vé.');
                } finally {
                    await queryRunner.release();
                }

                // return updated pending tickets (status updated)
                return pending;
            }
        }

        // Default path: just update statuses for PENDING -> newStatus (no restore)
        const updated: Ticket[] = [];
        for (const ticket of tickets) {
            if (ticket.status === TicketStatus.PENDING_PAYMENT) {
                ticket.status = newStatus;
                await this.ticketRepository.save(ticket);
                updated.push(ticket);
            } else {
                console.warn(
                    `Ticket ${ticket.ticketCode} status is ${ticket.status}, skipping update.`,
                );
            }
        }
        return updated;
    }

    /**
     * Admin xuất vé trực tiếp: cũng nên trừ quantity nếu có giới hạn
     */
    async issueTicketsDirectly(
        showtimeId: number,
        quantity: number,
        adminUser: User,
    ) {
        const tickets: Ticket[] = [];
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const showtime = await this.showtimeService.findOne(showtimeId);
            if (!showtime) throw new Error('Không tìm thấy suất chiếu.');

            const event = showtime.event;
            // NOTE: assume showtime.ticketClasses contains TicketClass entities
            const ticketClass = showtime.ticketClasses?.[0];
            if (!ticketClass) throw new Error('Không có loại vé khả dụng.');

            // Lock ticketClass
            const lockedTicketClass = await queryRunner.manager
                .createQueryBuilder(TicketClass, 'tc')
                .setLock('pessimistic_write')
                .where('tc.id = :id', { id: ticketClass.id })
                .getOne();

            if (!lockedTicketClass) throw new Error('Không tìm thấy loại vé (lock).');

            if (
                lockedTicketClass.quantity !== null &&
                lockedTicketClass.quantity < quantity
            ) {
                throw new BadRequestException(
                    `Chỉ còn ${lockedTicketClass.quantity} vé khả dụng.`,
                );
            }

            if (lockedTicketClass.quantity !== null) {
                lockedTicketClass.quantity = lockedTicketClass.quantity - quantity;
                await queryRunner.manager.save(lockedTicketClass);
            }

            for (let i = 0; i < quantity; i++) {
                const randomPart = Math.floor(100000 + Math.random() * 900000);
                const ticketCode = `${event.shortkey || 'EVT'}-${Date.now()}-${randomPart}`;

                const newTicket = this.ticketRepository.create({
                    ticketCode,
                    status: TicketStatus.PAID,
                    owner: null,
                    ownerId: null,
                    ticketClassId: ticketClass.id,
                    event,
                    eventId: event.id,
                    formData: { issuedBy: adminUser.username },
                    payosPaymentId: null,
                    customerName: 'Khách mời',
                    customerEmail: 'guest@example.com',
                });

                const savedTicket = await queryRunner.manager.save(newTicket);
                tickets.push(savedTicket);
            }

            await queryRunner.commitTransaction();
            return { success: true, tickets };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Error issuing tickets directly:', err);
            throw new InternalServerErrorException('Không thể xuất vé.');
        } finally {
            await queryRunner.release();
        }
    }

    // Tìm vé theo payosPaymentId (dùng cho trang success)
    async findTicketsByPayOSId(payosPaymentId: number): Promise<Ticket[]> {
        return this.ticketRepository.find({
            where: { payosPaymentId },
            relations: ['event', 'ticketClass'],
        });
    }

    async findTicketsByEmail(email: string): Promise<Ticket[]> {
        return this.ticketRepository.find({
            where: { customerEmail: email },
            relations: ['event', 'ticketClass'],
        })
    }


}
