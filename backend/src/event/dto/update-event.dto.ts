/* backend/src/event/dto/update-event.dto.ts */
import { IsString, IsOptional, IsAlphanumeric, Length } from 'class-validator';

export class UpdateEventDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    @IsAlphanumeric()
    @Length(3, 10)
    shortkey?: string;

    // Thumbnail sẽ được xử lý riêng thông qua @UploadedFile
}