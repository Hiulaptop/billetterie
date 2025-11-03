import {
    Controller,
    Body,
    Post,
    HttpCode,
    HttpStatus,
    Get,
    UseGuards,
    Request
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from "../user/user.service";
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import {User} from "../user/entities/user.entity";
import {JwtAuthGuard} from "./jwt-auth.guard";


@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto){
        const user = await this.userService.create(createUserDto);
        const { password, ...result } = user;
        return result;
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.signIn(loginDto.username, loginDto.password);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        return req.user; // req.user được giải mã từ JWT
    }
}
