/* backend/src/event/dto/update-event.dto.ts */
import { IsString, IsOptional, IsAlphanumeric, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEventDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    @IsAlphanumeric('en-US', { message: 'Shortkey must contain only letters and numbers' })
    @Length(3, 10, { message: 'Shortkey must be between 3 and 10 characters' })
    @Transform(({ value }) => value.toUpperCase())
    shortkey?: string;

    // Thumbnail sẽ được xử lý riêng thông qua @UploadedFile nếu có
    // Các trường ticketClasses, showtimes, images, form sẽ được cập nhật qua các endpoint riêng
}