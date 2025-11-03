import { Controller, Post, Body, UseGuards, Req, ValidationPipe, Get, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import {Roles} from "../auth/decorators/roles.decorator";
import {Role} from "../user/enums/role.enum";
import {RolesGuard} from "../auth/guards/roles.guard";


@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.Admin)
    // @Post('admin-issue')
    // async adminIssueTickets(
    //     @Req() req: any,
    //     @Body() body: { ticketClassId: number; quantity: number },
    // ) {
    //     const user = req.user as User;
    //
    //     return this.ordersService.issueTicketsDirectly(
    //         body.ticketClassId,
    //         body.quantity,
    //         user,
    //     );
    // }

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

    @Public()
    @Post('payos-hook')
    async handlePayosHook(@Body() body: any) {
        // Body có thể chứa { orderCode, status, code } do frontend gửi lên
        // console.log('📩 Nhận hook từ frontend:', body);
        return this.ordersService.handlePayosHook(body);
    }

}