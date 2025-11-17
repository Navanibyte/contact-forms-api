/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Form } from './entity/form.entity';
import { FormField } from './entity/form-field.entity';

import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormSubmission } from './entity/form-submission.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { SubmitFormDto } from './dto/submit-form.dto';

@Injectable()
export class FormsService {
    constructor(
        @InjectRepository(Form) private formRepo: Repository<Form>,
        @InjectRepository(FormField) private fieldRepo: Repository<FormField>,
        @InjectRepository(FormSubmission) private submissionRepo: Repository<FormSubmission>,
        private mailer: MailerService,
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

    async update(formId: number, updateFormDto: UpdateFormDto, userId: number) {
        const { fields, ...formData } = updateFormDto;

        // 1. Check if form exists and belongs to the user
        const existingForm = await this.formRepo.findOne({
            where: { form_id: formId, userId },
            relations: ['fields'],
        });

        if (!existingForm) {
            throw new NotFoundException("Form not found or you don't have access");
        }

        // 2. Update the form (title, description)
        await this.formRepo.update({ form_id: formId }, { ...formData });

        // 3. Delete old fields
        await this.fieldRepo.delete({ form: { form_id: formId } });

        // 4. Insert new fields
        const newFieldEntities = fields.map((field) =>
            this.fieldRepo.create({
                ...field,
                form: existingForm,
                userId
            })
        );

        await this.fieldRepo.save(newFieldEntities);

        // 5. Return fresh updated form
        return this.formRepo.findOne({
            where: { form_id: formId },
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

    async findOne(id: number) {
        const form = await this.formRepo.findOne({
            where: { form_id: id },
            relations: ['fields'],
        });

        if (!form) {
            throw new NotFoundException("Form not found");
        }

        return form;
    }

    async remove(id: number) {
        return this.formRepo.delete(id);
    }


    async submitForm(
        formId: string,
        userId: number,
        email: string,
        dto: SubmitFormDto,
    ) {
        const submission = this.submissionRepo.create({
            form_id: formId,
            user_id: userId,
            submission_json: dto,
        });

        const saved = await this.submissionRepo.save(submission);

        // Send email to user
        await this.mailer.sendMail({
            to: email, // replace later with actual user email
            subject: `Form Submitted Successfully`,
            text: `Your form ${formId} has been submitted.\n\nDetails:\n${JSON.stringify(dto, null, 2)}`
        });

        return saved;
    }

}
