import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {UserModule} from "../user/user.module";
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory:async(configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: '6m',
                },
            }),
            inject: [ConfigService],
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
    ]
})
export class AuthModule {}
