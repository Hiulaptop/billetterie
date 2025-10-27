/* backend/src/event/showtime/showtime.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from '../entities/showtime.entity';
import { Event } from '../entities/event.entity';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeService } from './showtime.service';

@Module({
    imports: [TypeOrmModule.forFeature([Showtime, Event])],
    controllers: [ShowtimeController],
    providers: [ShowtimeService],
    exports: [ShowtimeModule] // Export nếu EventModule import
})
export class ShowtimeModule {}