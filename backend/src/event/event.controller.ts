import {Controller, Get, Param} from "@nestjs/common";
import { EventService } from "./event.service";

@Controller('event')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Get(':id')
    getid(@Param('id') id: number ) {
        return this.eventService.getID(id);
    }
}

// params