import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from "../user/user.service";
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ){}

    async signIn(username: string, password: string): Promise<{ access_token: string }> {
        const user = await this.userService.findOneByUsername(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        const payload = { sub: user.id, username: user.username, role: user.role };

        return {
            access_token: this.jwtService.sign(payload),
        }
    }
}
