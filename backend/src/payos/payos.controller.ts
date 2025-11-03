import {
    Controller,
    Post,
    Body,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { PayosService } from './payos.service';
import { OrdersService } from '../orders/orders.service'; // import OrdersService
import { ConfigService } from '@nestjs/config';

@Controller('payos')
export class PayosController {
    private readonly logger = new Logger(PayosController.name);

    constructor(
        private readonly payosService: PayosService,
        private readonly configService: ConfigService,
        private readonly ordersService: OrdersService, // ✅ Gọi sang OrdersService để update vé
    ) {}

    @Post('webhook')
    async handleWebhook(@Body() webhookData: any) {
        this.logger.log('📩 Webhook received:', JSON.stringify(webhookData, null, 2));

        try {
            // ✅ 1. (Khuyến nghị) xác thực webhook — trong thực tế cần verify chữ ký.
            // const verifiedData = this.payosService.payos.verifyWebhook(webhookData);
            // Tạm thời bỏ qua để test
            const verifiedData = webhookData.data;

            if (!verifiedData) {
                throw new InternalServerErrorException('Invalid webhook payload');
            }

            const payosOrderCode = verifiedData.orderCode;
            const status = verifiedData.status || verifiedData.code;

            if (!payosOrderCode) {
                this.logger.error('❌ Webhook missing orderCode');
                throw new InternalServerErrorException('Webhook missing orderCode');
            }

            // ✅ 2. Phân loại trạng thái thanh toán
            if (status === 'PAID' || status === '00') {
                this.logger.log(`✅ Payment successful for order ${payosOrderCode}`);

                // Gọi OrdersService để cập nhật vé
                await this.ordersService.handleSuccessfulPayment(payosOrderCode);
            } else {
                this.logger.warn(`⚠️ Payment failed or pending for order ${payosOrderCode}: ${status}`);
                // Nếu muốn, thêm:
                // await this.ordersService.handleFailedPayment(payosOrderCode);
            }

            return { success: true };
        } catch (error) {
            this.logger.error('💥 Webhook processing failed:', error);
            throw new InternalServerErrorException('Webhook processing error');
        }
    }
}
