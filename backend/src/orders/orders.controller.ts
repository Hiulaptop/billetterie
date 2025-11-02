import { Controller, Post, Body, UseGuards, Req, ValidationPipe, Get, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';


@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Public()
    @Post('create-payment')
    async createPayment(
        @Body(new ValidationPipe()) createOrderDto: CreateOrderDto,
        @Req() req: any,
    ) {
        const user = req.user as User | null;
        return this.ordersService.createPaymentLink(createOrderDto, user);
    }

    @Get('success/:payosOrderCode')
    @Public()
    async handlePaymentSuccess(
        @Param('payosOrderCode', ParseIntPipe) payosOrderCode: number,
        @Req() req: any,
    ) {
        const user = req.user as User;
        this.ordersService.handleSuccessfulPayment(payosOrderCode);
    }

    @Get('confirmation/:payosOrderCode')
    @Public()
    async getOrderConfirmation(
        @Param('payosOrderCode', ParseIntPipe) payosOrderCode: number,
        @Req() req: any,
    ) {
        const user = req.user as User;
        return this.ordersService.getOrderConfirmation(payosOrderCode, user);
    }


}