/* backend/src/event/dto/create-event.dto.ts */
import { IsString, IsNotEmpty, IsAlphanumeric, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255) // Giới hạn độ dài title
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    @IsAlphanumeric('en-US', { message: 'Shortkey must contain only letters and numbers' }) // Chỉ cho phép chữ và số (tiếng Anh)
    @Length(3, 10, { message: 'Shortkey must be between 3 and 10 characters' })
    @Transform(({ value }) => value.toUpperCase()) // Tự động chuyển thành chữ hoa
    shortkey: string;

    // Thumbnail sẽ được xử lý qua @UploadedFile() trong controller
    // Các trường khác như ticketClasses, showtimes, images, form là không bắt buộc khi tạo event ban đầu
}