/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Form } from './entity/form.entity';
import { FormField } from './entity/form-field.entity';

import { CreateFormDto } from './dto/create-form.dto';

@Injectable()
export class FormsService {
    constructor(
        @InjectRepository(Form) private formRepo: Repository<Form>,
        @InjectRepository(FormField) private fieldRepo: Repository<FormField>,
    ) { }

    async create(createFormDto: CreateFormDto, userId: number) {
        const { fields, ...formData } = createFormDto;

        // Store userId in the form
        const form = this.formRepo.create({
            ...formData,
            userId,
        });

        const savedForm = await this.formRepo.save(form);

        // Store userId and relation in fields
        const fieldEntities = fields.map((field) =>
            this.fieldRepo.create({
                ...field,
                userId,
                form: savedForm, // TypeORM sets form_id automatically
            }),
        );

        await this.fieldRepo.save(fieldEntities);

        return this.formRepo.find({
            where: { form_id: savedForm.form_id },
            relations: ['fields'],
        });
    }


    findAll() {
        return this.formRepo.find({ relations: ['fields'] });
    }

    findAllByUser(userId: number) {
        return this.formRepo.find({
            where: { userId },
            relations: ['fields'],
        });
    }

    findOne(id: number) {
        return this.formRepo.findOne({ where: { form_id: id }, relations: ['fields'] });
    }

    async remove(id: number) {
        return this.formRepo.delete(id);
    }
}
