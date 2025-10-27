import {
    Controller,
    Get,
    Post,
    Body,
    Logger,
    InternalServerErrorException } from '@nestjs/common';
import { PayosService } from './payos.service';
import { ConfigService } from '@nestjs/config';
// Import your OrdersService to update the database
// import { OrdersService } from '../orders/orders.service'; 

@Controller('payos')
export class PayosController {
    private readonly logger = new Logger(PayosController.name);
    constructor(
        private payosService: PayosService,
        private configService: ConfigService,
        // private ordersService: OrdersService,
    ) {}

    @Post('webhook')
    async handleWebhook(@Body() webhookData: any) {
        // ... (Your webhook logic is correct)
        this.logger.log('Webhook received:', JSON.stringify(webhookData, null, 2));

        try {
            const verifiedData = await this.payosService.payos.webhooks.verify(webhookData);

            if (verifiedData.code === '00') {
                this.logger.log('Payment successful for order:', verifiedData.orderCode);
            } else {
                this.logger.warn('Payment failed or pending:', verifiedData.desc);
            }

            return { success: true };

        } catch (error) {
            this.logger.error('Webhook verification failed:', error);
            throw new InternalServerErrorException('Webhook processing error');
        }
    }

    @Get('test-pay')
    async createTestPayment() {
        this.logger.log('Creating test payment link for 10,000 VND...');
        const orderCode = Number(String(Date.now()).slice(-6));
        const paymentData = {
            orderCode,
            amount: 10000,
            description: 'Test Payment 10000VND',
            returnUrl: `${this.configService.get<string>('FRONTEND_URL')}/payment-success`,
            cancelUrl: `${this.configService.get<string>('FRONTEND_URL')}/payment-failed`,
        }

        try{
            const paymentLink =     await this.payosService.payos.paymentRequests.create(paymentData);
            return paymentLink;
        }
        catch(error){
            this.logger.error('Failed to create payment link', error);
            throw new InternalServerErrorException('Failed to create payment link.');
        }
    }
}