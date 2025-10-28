import { Module } from '@nestjs/common';
import { PayosService } from './payos.service';
import { ConfigModule } from '@nestjs/config';
// We will add a controller later
// import { PayosController } from './payos.controller';
import { PayosController } from './payos.controller';
import { TicketModule } from '../ticket/ticket.module'; // Import TicketModule

@Module({
    imports: [
        ConfigModule,
        TicketModule,
    ], // Import ConfigModule
    providers: [PayosService],
    exports: [PayosService],
    controllers: [PayosController],
})
export class PayosModule {}