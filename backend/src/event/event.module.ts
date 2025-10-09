import { Module } from '@nestjs/common';
// import { AppController } from './event.controller';
// import { AppService } from './event.service';
import { EventService } from './event.service';
import {EventController} from "./event.controller";

@Module({
    imports: [],
    controllers: [EventController],
    providers: [EventService],
})
export class EventModule {}
