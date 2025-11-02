import { Module } from '@nestjs/common';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { Ticket } from "../event/entities/ticket.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserService} from "../user/user.service";
import {User} from "../user/entities/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Ticket]),
        TypeOrmModule.forFeature([User]),
    ],
  controllers: [CheckinController],
  providers: [
      CheckinService,
      UserService,
  ]
})
export class CheckinModule {}
