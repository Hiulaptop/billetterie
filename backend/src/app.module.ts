import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {EventModule } from './event/event.module';

@Module({
  imports: [
      TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 5432,
          username: 'root',
          password: 'root',
          database: 'billetterie',
          entities: [],
          synchronize: true,
      }),
      EventModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
