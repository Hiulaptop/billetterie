/* backend/src/event/form/form.service.ts */
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Form } from '../entities/form.entity';
import { FormField } from '../entities/form-field.entity';
import { FieldOption } from '../entities/field-option.entity';
import { Event } from '../entities/event.entity';
import { CreateFormDto, CreateFormFieldDto, UpdateFormDto, UpdateFormFieldDto } from './dto/form.dto';

@Injectable()
export class FormService {
    constructor(
        @InjectRepository(Form)
        private formRepository: Repository<Form>,
        @InjectRepository(FormField)
        private formFieldRepository: Repository<FormField>,
        @InjectRepository(FieldOption)
        private fieldOptionRepository: Repository<FieldOption>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        private dataSource: DataSource,
    ) {}

    /**
     * Tạo Form mới và gán vào Event
     */
    async createForm(createDto: CreateFormDto): Promise<Form> {
        const event = await this.eventRepository.findOne({
            where: { id: createDto.eventId },
            relations: ['form']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${createDto.eventId} not found.`);
        }
        if (event.form) {
            throw new ConflictException(`Event ${event.id} already has a form (Form ID: ${event.form.id}).`);
        }

        const { eventId, fields, ...formDto } = createDto;

        const newForm = this.formRepository.create({
            ...formDto,
            event: event,
            fields: [],
        });

        if (fields && fields.length > 0) {
            newForm.fields = fields.map(fieldDto => {
                const { options, ...fieldData } = fieldDto;
                const newField = this.formFieldRepository.create(fieldData);
                if (options && options.length > 0) {
                    newField.options = options.map(optDto => this.fieldOptionRepository.create(optDto));
                }
                return newField;
            });
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const savedForm = await queryRunner.manager.save(newForm);
            event.form = savedForm; // Gán form đã lưu
            await queryRunner.manager.save(event);

            await queryRunner.commitTransaction();
            return savedForm;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error("Error creating form:", err);
            throw new BadRequestException('Failed to create form.');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Lấy Form theo ID
     */
    async getForm(id: number): Promise<Form> {
        const form = await this.formRepository.findOne({
            where: { id },
            relations: ['event', 'fields', 'fields.options'],
            order: { fields: { displayOrder: 'ASC', options: { displayOrder: 'ASC' } } }
        });
        if (!form) {
            throw new NotFoundException(`Form with ID ${id} not found.`);
        }
        return form;
    }

    /**
     * Lấy Form theo Event ID
     */
    async getFormByEvent(eventId: number): Promise<Form> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['form', 'form.fields', 'form.fields.options']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found.`);
        }
        if (!event.form) {
            throw new NotFoundException(`Event ${eventId} does not have a form.`);
        }

        // Sắp xếp
        if (event.form.fields) {
            event.form.fields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            event.form.fields.forEach(field => {
                if (field.options) {
                    field.options.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                }
            });
        }

        return event.form;
    }

    /**
     * Cập nhật thông tin Form (title, description)
     */
    async updateForm(id: number, updateDto: UpdateFormDto): Promise<Form> {
        const form = await this.getForm(id);
        this.formRepository.merge(form, updateDto);
        return this.formRepository.save(form);
    }

    /**
     * Xóa Form (sẽ tự động set event.form = null)
     */
    async deleteForm(id: number): Promise<void> {
        const result = await this.formRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Form with ID ${id} not found.`);
        }
    }

    // --- CRUD cho FormField ---

    async addField(formId: number, createDto: CreateFormFieldDto): Promise<FormField> {
        const form = await this.getForm(formId);
        const { options, ...fieldData } = createDto;

        const newField = this.formFieldRepository.create({
            ...fieldData,
            form: form,
        });

        if (options && options.length > 0) {
            newField.options = options.map(optDto => this.fieldOptionRepository.create(optDto));
        }

        return this.formFieldRepository.save(newField);
    }

    async updateField(fieldId: number, updateDto: UpdateFormFieldDto): Promise<FormField> {
        const field = await this.formFieldRepository.findOne({
            where: { id: fieldId },
            relations: ['options']
        });
        if (!field) {
            throw new NotFoundException(`FormField with ID ${fieldId} not found.`);
        }

        const { options, ...fieldData } = updateDto;

        if (options) {
            // Xóa options cũ
            await this.fieldOptionRepository.delete({ field: { id: fieldId } });
            // Tạo options mới
            field.options = options.map(optDto => this.fieldOptionRepository.create(optDto));
        }

        this.formFieldRepository.merge(field, fieldData);
        return this.formFieldRepository.save(field);
    }

    async removeField(fieldId: number): Promise<void> {
        const result = await this.formFieldRepository.delete(fieldId);
        if (result.affected === 0) {
            throw new NotFoundException(`FormField with ID ${fieldId} not found.`);
        }
    }
}