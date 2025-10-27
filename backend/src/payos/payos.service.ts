import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node'; // <-- 1. Change this line

@Injectable()
export class PayosService implements OnModuleInit {
    public payos: PayOS; // <-- 2. This type will now be correct

    constructor(private configService: ConfigService) {}

    onModuleInit() {
        // 3. This constructor will now work
        this.payos = new PayOS({
            clientId: this.configService.get<string>('PAYOS_CLIENT_ID'),
            apiKey: this.configService.get<string>('PAYOS_API_KEY'),
            checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
        });
    }
}