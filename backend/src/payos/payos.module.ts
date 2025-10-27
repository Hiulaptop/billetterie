import { Module } from '@nestjs/common';
import { PayosService } from './payos.service';
import { ConfigModule } from '@nestjs/config';
// We will add a controller later
// import { PayosController } from './payos.controller';
import { PayosController } from './payos.controller';

@Module({
    imports: [ConfigModule], // Import ConfigModule
    providers: [PayosService],
    exports: [PayosService],
    controllers: [PayosController],
})
export class PayosModule {}