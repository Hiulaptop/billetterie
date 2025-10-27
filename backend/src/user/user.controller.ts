import { Controller, Request, Get, Post, Put, Delete, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}


    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        // Because of our JwtStrategy's validate() method,
        // `req.user` contains the payload { userId, username }.
        return req.user;
    }
}