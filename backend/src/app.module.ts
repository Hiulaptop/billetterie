import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {EventModule } from './event/event.module';
import {UserModule} from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { PayosModule } from './payos/payos.module';
import { ShowtimeModule } from './event/showtime/showtime.module';
import { TicketClassModule } from './event/ticket-class/ticket-class.module';
import { FormController } from './event/form/form.controller';
import { FormModule } from './event/form/form.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
      }),
      TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'Hieu200806@',
          database: 'billetterie',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          // entities: ["../entities/event.entity{.ts,.js}"],
          synchronize: true,
      }),
      EventModule,
      UserModule,
      AuthModule,
      PayosModule,
      ShowtimeModule,
      TicketClassModule,
      FormModule,
      OrdersModule,
  ],
  controllers: [AppController, FormController],
  providers: [AppService],
})
export class AppModule {}
