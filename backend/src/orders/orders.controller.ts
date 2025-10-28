import { Controller, Post, Body, UseGuards, Req, ValidationPipe, Get, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('create-payment')
    @UseGuards(JwtAuthGuard)
    async createPayment(
        @Body(new ValidationPipe()) createOrderDto: CreateOrderDto,
        @Req() req: any,
    ) {
        const user = req.user as User;
        if (!user) {
            throw new ForbiddenException('Authentication required.');
        }
        return this.ordersService.createPaymentLink(createOrderDto, user);
    }

    @Get('confirmation/:payosOrderCode')
    @UseGuards(JwtAuthGuard)
    async getOrderConfirmation(
        @Param('payosOrderCode', ParseIntPipe) payosOrderCode: number,
        @Req() req: any,
    ) {
        const user = req.user as User;
        return this.ordersService.getOrderConfirmation(payosOrderCode, user);
    }
}