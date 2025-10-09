import { Injectable } from '@nestjs/common';

@Injectable()
export class EventService {
    getID(id: number): number {
        return(id);
    }
}