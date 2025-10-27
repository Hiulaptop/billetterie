/* backend/src/event/form/form.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form } from '../entities/form.entity';
import { FormField } from '../entities/form-field.entity';
import { FieldOption } from '../entities/field-option.entity';
import { Event } from '../entities/event.entity';
import { FormController } from './form.controller';
import { FormService } from './form.service';

@Module({
    imports: [TypeOrmModule.forFeature([Form, FormField, FieldOption, Event])],
    controllers: [FormController],
    providers: [FormService],
    exports: [FormModule, FormService] // Export
})
export class FormModule {}