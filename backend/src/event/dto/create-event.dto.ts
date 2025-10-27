/* backend/src/event/dto/create-event.dto.ts */
import { IsString, IsNotEmpty, IsAlphanumeric, Length } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    @IsAlphanumeric() // Đảm bảo shortkey chỉ chứa chữ và số
    @Length(3, 10) // Giới hạn độ dài shortkey
    shortkey: string;

    // Thumbnail sẽ được xử lý riêng thông qua @UploadedFile
}