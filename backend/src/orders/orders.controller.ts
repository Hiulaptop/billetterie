import { Controller, Post, Body, UseGuards, Req, ValidationPipe, Get, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

// Tự tạo một Guard tùy chọn (OptionalJwtAuthGuard)
import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    // Ghi đè phương thức handleRequest
    handleRequest(err, user, info, context) {
        // Không ném lỗi nếu không có user hoặc có lỗi token
        // Chỉ trả về user nếu xác thực thành công, ngược lại trả về null
        return user || null;
    }
}

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('create-payment')
    @UseGuards(OptionalJwtAuthGuard)
    async createPayment(
        @Body(new ValidationPipe()) createOrderDto: CreateOrderDto,
        @Req() req: any,
    ) {
        const user = req.user as User | null;
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