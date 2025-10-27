/* backend/src/event/form/form.controller.ts */
import {
    Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,
    UseGuards, ValidationPipe, HttpCode, HttpStatus, Query, Put, UsePipes
} from '@nestjs/common';
import { FormService } from './form.service';
import { CreateFormDto, CreateFormFieldDto, UpdateFormDto, UpdateFormFieldDto } from './dto/form.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../user/enums/role.enum';
import { Form } from '../entities/form.entity';
import { FormField } from '../entities/form-field.entity';

@Controller('forms')
@UseGuards(JwtAuthGuard, RolesGuard) // Bảo vệ tất cả
export class FormController {
    constructor(private readonly formService: FormService) {}

    // --- Form CRUD ---

    @Post()
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    createForm(@Body() createDto: CreateFormDto): Promise<Form> {
        return this.formService.createForm(createDto);
    }

    // Lấy form theo Event ID (Public - cho phép User)
    @Get()
    @Roles(Role.Admin, Role.Staff, Role.User) // Mở cho User
    getFormByEvent(@Query('eventId', ParseIntPipe) eventId: number): Promise<Form> {
        return this.formService.getFormByEvent(eventId);
    }

    // Lấy form theo Form ID
    @Get(':id')
    @Roles(Role.Admin, Role.Staff)
    getForm(@Param('id', ParseIntPipe) id: number): Promise<Form> {
        return this.formService.getForm(id);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true, skipMissingProperties: true }))
    updateForm(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateFormDto): Promise<Form> {
        return this.formService.updateForm(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteForm(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.formService.deleteForm(id);
    }

    // --- FormField CRUD ---

    @Post(':formId/fields')
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    addField(
        @Param('formId', ParseIntPipe) formId: number,
        @Body() createDto: CreateFormFieldDto
    ): Promise<FormField> {
        return this.formService.addField(formId, createDto);
    }

    @Put('/fields/:fieldId') // Dùng PUT
    @Roles(Role.Admin)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    updateField(
        @Param('fieldId', ParseIntPipe) fieldId: number,
        @Body() updateDto: UpdateFormFieldDto
    ): Promise<FormField> {
        return this.formService.updateField(fieldId, updateDto);
    }

    @Delete('/fields/:fieldId')
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    removeField(@Param('fieldId', ParseIntPipe) fieldId: number): Promise<void> {
        return this.formService.removeField(fieldId);
    }
}