/* backend/src/event/form/dto/form.dto.ts */
import {
    IsString, IsNotEmpty, IsInt, IsOptional, IsEnum,
    IsBoolean, IsArray, ValidateNested, MinLength
} from 'class-validator';
import { Type } from 'class-transformer';
// Đảm bảo bạn đã export enum này từ entity
// import { FieldType } from '../../entities/form-field.entity';

// Giả định enum FieldType được định nghĩa ở đâu đó
export enum FieldType {
    SHORT_ANSWER = 'short_answer',
    LONG_ANSWER = 'long_answer',
    DATE = 'date',
    CHECKBOX = 'checkbox',
    MULTIPLE_CHOICE = 'multiple_choice',
}

// --- DTO cho Lựa chọn (Option) ---
class CreateFieldOptionDto {
    @IsString()
    @IsNotEmpty()
    value: string; // Giá trị (ví dụ: "opt1")

    @IsOptional()
    @IsString()
    label?: string; // Nhãn hiển thị (ví dụ: "Lựa chọn 1")

    @IsOptional()
    @IsInt()
    displayOrder?: number = 0;
}

// --- DTO cho Trường (Field) ---
export class CreateFormFieldDto {
    @IsString()
    @MinLength(1)
    label: string; // Câu hỏi / Nhãn

    @IsEnum(FieldType, { message: 'Invalid field type' })
    type: FieldType; // Loại trường

    @IsBoolean()
    @IsOptional()
    required?: boolean = false; // Bắt buộc hay không

    @IsInt()
    @IsOptional()
    displayOrder?: number = 0; // Thứ tự hiển thị

    @IsString()
    @IsOptional()
    placeholder?: string; // Gợi ý

    // Nếu type là CHECKBOX/MULTIPLE_CHOICE, options có thể được thêm vào
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true }) // Validate từng object trong mảng
    @Type(() => CreateFieldOptionDto) // Biến đổi plain object thành class
    options?: CreateFieldOptionDto[];
}

// DTO để cập nhật Field
export class UpdateFormFieldDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    label?: string;

    @IsOptional()
    @IsEnum(FieldType)
    type?: FieldType;

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsInt()
    displayOrder?: number;

    @IsOptional()
    @IsString()
    placeholder?: string;

    // Cho phép cập nhật cả options (thường là xóa cũ tạo mới)
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFieldOptionDto)
    options?: CreateFieldOptionDto[];
}

// --- DTO cho Form ---
export class CreateFormDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number; // Event mà form này thuộc về

    @IsString()
    @IsNotEmpty()
    title: string; // Tiêu đề Form

    @IsOptional()
    @IsString()
    description?: string; // Mô tả Form

    // Cho phép thêm các field ngay khi tạo form
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFormFieldDto)
    fields?: CreateFormFieldDto[];
}

// DTO cập nhật thông tin cơ bản của Form
export class UpdateFormDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;
}