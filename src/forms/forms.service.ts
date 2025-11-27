/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { FormStyles, IFormField } from './types';


@Injectable()
export class FormsService {
    constructor(
        @InjectRepository(Form) private formRepo: Repository<Form>,
        @InjectRepository(FormField) private fieldRepo: Repository<FormField>,
        @InjectRepository(FormSubmission) private submissionRepo: Repository<FormSubmission>,
        private mailer: MailerService,
    ) { }


    private readonly DEFAULT_STYLES: FormStyles = {
        container: {
            backgroundColor: '#f8f9fc',
            maxWidth: '800px',
            padding: '40px',
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        },
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '32px',
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#1f2937',
            textAlign: 'left',
        },
        description: {
            fontSize: '15px',
            color: '#6b7280',
            textAlign: 'left',
        },
        fields: {
            labelColor: '#374151',
            labelFontSize: '14px',
            labelFontWeight: '500',
            inputBackgroundColor: '#f9fafb',
            inputBorderColor: '#d1d5db',
            inputBorderRadius: '10px',
            inputPadding: '12px',
            inputFontSize: '15px',
        },
        button: {
            backgroundColor: '#f97316',
            textColor: '#ffffff',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '17px',
            fontWeight: '600',
            hoverBackgroundColor: '#ea580c',
        },
    };

    // async create(createFormDto: CreateFormDto, userId: number) {
    //     const { fields, ...formData } = createFormDto;

    //     // Store userId in the form
    //     const form = this.formRepo.create({
    //         ...formData,
    //         userId,
    //     });

    //     const savedForm = await this.formRepo.save(form);

    //     // Store userId and relation in fields
    //     const fieldEntities = fields.map((field) =>
    //         this.fieldRepo.create({
    //             ...field,
    //             userId,
    //             form: savedForm, // TypeORM sets form_id automatically
    //         }),
    //     );

    //     await this.fieldRepo.save(fieldEntities);

    //     return this.formRepo.find({
    //         where: { form_id: savedForm.form_id },
    //         relations: ['fields'],
    //     });
    // }

    // async update(formId: number, updateFormDto: UpdateFormDto, userId: number) {
    //     const { fields, ...formData } = updateFormDto;

    //     // 1. Check if form exists and belongs to the user
    //     const existingForm = await this.formRepo.findOne({
    //         where: { form_id: formId, userId },
    //         relations: ['fields'],
    //     });

    //     if (!existingForm) {
    //         throw new NotFoundException("Form not found or you don't have access");
    //     }

    //     // 2. Update the form (title, description)
    //     await this.formRepo.update({ form_id: formId }, { ...formData });

    //     // 3. Delete old fields
    //     await this.fieldRepo.delete({ form: { form_id: formId } });

    //     // 4. Insert new fields
    //     const newFieldEntities = fields.map((field) =>
    //         this.fieldRepo.create({
    //             ...field,
    //             form: existingForm,
    //             userId
    //         })
    //     );

    //     await this.fieldRepo.save(newFieldEntities);

    //     // 5. Return fresh updated form
    //     return this.formRepo.findOne({
    //         where: { form_id: formId },
    //         relations: ['fields'],
    //     });
    // }


    async create(createFormDto: CreateFormDto, userId: number) {
        const { fields, ...formData } = createFormDto;

        // Create form entity
        const form = this.formRepo.create({
            ...formData,
            userId,
        });

        const savedForm = await this.formRepo.save(form);

        // Create field entities
        const fieldEntities = fields.map((field, index) =>
            this.fieldRepo.create({
                ...field,
                userId,
                form: savedForm,
                field_order: index,
            }),
        );

        const savedFields = await this.fieldRepo.save(fieldEntities);

        // Generate embedded HTML
        const embeddedHtml = this.generateFullEmbedHTML(
            {
                form_id: savedForm.form_id,
                title: savedForm.title,
                description: savedForm.description,
                styles: savedForm.styles,
            },
            savedFields.map((f: any) => ({
                field_id: f.field_id,
                type: f.type,
                label: f.label,
                placeholder: f.placeholder,
                required: f.required,
                options: f.options,
                width: f.width,
                position: f.field_order,
            })),
        );

        console.log("savedForm::::", savedForm);

        // Update form with embedded HTML
        await this.formRepo.update(savedForm.form_id, {
            embedded_code: embeddedHtml,
        });

        return this.formRepo.findOne({
            where: { form_id: savedForm.form_id },
            relations: ['fields'],
        });
    }

    async update(formId: number, updateFormDto: UpdateFormDto, userId: number) {
        const { fields, ...formData } = updateFormDto;

        // Check if form exists and belongs to user
        const existingForm = await this.formRepo.findOne({
            where: { form_id: formId, userId },
            relations: ['fields'],
        });

        if (!existingForm) {
            throw new NotFoundException("Form not found or you don't have access");
        }

        // Update form data
        await this.formRepo.update({ form_id: formId }, { ...formData });

        // Delete old fields
        await this.fieldRepo.delete({ form: { form_id: formId } });

        // Insert new fields
        const newFieldEntities = fields.map((field, index) =>
            this.fieldRepo.create({
                ...field,
                form: existingForm,
                userId,
                field_order: index,
            }),
        );

        const savedFields = await this.fieldRepo.save(newFieldEntities);

        // Get updated form
        const updatedForm = await this.formRepo.findOne({
            where: { form_id: formId },
        });

        // Generate new embedded HTML
        const embeddedHtml = this.generateFullEmbedHTML(
            {
                form_id: updatedForm?.form_id,
                title: updatedForm?.title,
                description: updatedForm?.description,
                styles: updatedForm?.styles || this.DEFAULT_STYLES,
            },
            savedFields.map((f: any) => ({
                field_id: f.field_id,
                type: f.type,
                label: f.label,
                placeholder: f.placeholder,
                required: f.required,
                options: f.options,
                width: f.width,
                position: f.field_order,
            })),
        );

        // Update form with new embedded HTML
        await this.formRepo.update(formId, {
            embedded_code: embeddedHtml,
        });

        return this.formRepo.findOne({
            where: { form_id: formId },
            relations: ['fields'],
        });
    }




    findAll() {
        return this.formRepo.find({ relations: ['fields'] });
    }

   async findAllByUser(userId: number) {
    const forms = await this.formRepo.find({
        where: { userId },
        relations: ['fields'],
    });

    // Fetch submission counts for each form
    const formsWithSubmissions = await Promise.all(
        forms.map(async (form) => {
            const submissionCount = await this.submissionRepo.count({
                where: { form_id: form.form_id.toString() } // Convert to string
            });
            
            return {
                ...form,
                total_submissions: submissionCount
            };
        })
    );

    return formsWithSubmissions;
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


    // async submitForm(
    //     formId: string,
    //     userId: number,
    //     email: string,
    //     dto: SubmitFormDto,
    // ) {
    //     const submission = this.submissionRepo.create({
    //         form_id: formId,
    //         user_id: userId,
    //         submission_json: dto,
    //     });

    //     const saved = await this.submissionRepo.save(submission);

    //     // Send email to user
    //     await this.mailer.sendMail({
    //         to: email, // replace later with actual user email
    //         subject: `Form Submitted Successfully`,
    //         // text: `Your form ${formId} has been submitted.\n\nDetails:\n${JSON.stringify(dto, null, 2)}`
    //         html: dto.html, // <-- send HTML here
    //     });

    //     return saved;
    // }


   async getFormOwnerEmail(formId: number) {
    // 1️⃣ Fetch userId & email in ONE SQL query (best performance)
    const result = await this.formRepo.query(
        `
        SELECT u.id AS userId, u.email
        FROM custom_form.forms f
        JOIN custom_form.user u ON u.id = f.userId
        WHERE f.form_id = ?
        `,
        [formId]
    );

    if (!result || result.length === 0) {
        throw new Error("Form or User not found");
    }

    return result[0]; // { userId: 1, email: "abc@gmail.com" }
}

  private generateReadOnlyHtml(
        form: any,
        fields: IFormField[],
        formData: Record<string, any>,
    ): string {
        const styles = {
            container: { ...this.DEFAULT_STYLES.container, ...form.styles?.container },
            card: { ...this.DEFAULT_STYLES.card, ...form.styles?.card },
            title: { ...this.DEFAULT_STYLES.title, ...form.styles?.title },
            description: { ...this.DEFAULT_STYLES.description, ...form.styles?.description },
            fields: { ...this.DEFAULT_STYLES.fields, ...form.styles?.fields },
            button: { ...this.DEFAULT_STYLES.button, ...form.styles?.button },
        };

        let fieldsHtml = '';

        console.log("DEBUG → formData =", formData);
        console.log("DEBUG → fields =", fields);
        fields.forEach((field) => {
            const value = formData[field.field_id];
            let displayValue = '';

            switch (field.type) {
                case 'heading':
                    fieldsHtml += `
                        <tr>
                            <td colspan="2" style="padding: 24px 0 12px 0;">
                                <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: ${styles.title.color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                    ${field.label}
                                </h3>
                            </td>
                        </tr>
                    `;
                    break;

                case 'checkbox':
                    const isChecked = value === true || value === 'true';
                    displayValue = isChecked
                        ? `<span style="color: #10b981; font-weight: 600;">☑ Yes</span>`
                        : `<span style="color: #6b7280;">☐ No</span>`;

                    fieldsHtml += `
                        <tr>
                            <td style="padding: 12px 0; vertical-align: top; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <strong style="color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                                    ${field.label}
                                </strong>
                            </td>
                            <td style="padding: 12px 0; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <div style="color: #111827; font-size: ${styles.fields.inputFontSize};">
                                    ${displayValue}
                                </div>
                            </td>
                        </tr>
                    `;
                    break;

                case 'select':
                    const selectedOption = (field.options || []).find(
                        (opt) => opt.value === value,
                    );
                    displayValue =
                        selectedOption?.label ||
                        value ||
                        `<span style="color: #9ca3af; font-style: italic;">Not selected</span>`;

                    fieldsHtml += `
                        <tr>
                            <td style="padding: 12px 0; vertical-align: top; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <strong style="color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                                    ${field.label}${field.required ? '<span style="color: #ef4444;"> *</span>' : ''}
                                </strong>
                            </td>
                            <td style="padding: 12px 0; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <div style="background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; padding: ${styles.fields.inputPadding}; color: #111827; font-size: ${styles.fields.inputFontSize};">
                                    ${displayValue}
                                </div>
                            </td>
                        </tr>
                    `;
                    break;

                case 'textarea':
                    displayValue = value
                        ? String(value).replace(/\n/g, '<br>')
                        : `<span style="color: #9ca3af; font-style: italic;">Empty</span>`;

                    fieldsHtml += `
                        <tr>
                            <td style="padding: 12px 0; vertical-align: top; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <strong style="color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                                    ${field.label}${field.required ? '<span style="color: #ef4444;"> *</span>' : ''}
                                </strong>
                            </td>
                            <td style="padding: 12px 0; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <div style="background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; padding: ${styles.fields.inputPadding}; color: #111827; font-size: ${styles.fields.inputFontSize}; white-space: pre-wrap; word-break: break-word;">
                                    ${displayValue}
                                </div>
                            </td>
                        </tr>
                    `;
                    break;

                case 'signature':
                    displayValue = value
                        ? `<div style="font-style: italic; color: #111827; font-family: 'Brush Script MT', cursive;">${value}</div>`
                        : `<span style="color: #9ca3af; font-style: italic;">Not signed</span>`;

                    fieldsHtml += `
                        <tr>
                            <td style="padding: 12px 0; vertical-align: top; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <strong style="color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                                    ${field.label}${field.required ? '<span style="color: #ef4444;"> *</span>' : ''}
                                </strong>
                            </td>
                            <td style="padding: 12px 0; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <div style="border: 2px dashed ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; padding: ${styles.fields.inputPadding}; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: ${styles.fields.inputBackgroundColor};">
                                    ${displayValue}
                                </div>
                            </td>
                        </tr>
                    `;
                    break;

                default: // text, email, phone, address, date
                    displayValue = value
                        ? String(value)
                        : `<span style="color: #9ca3af; font-style: italic;">Empty</span>`;

                    fieldsHtml += `
                        <tr>
                            <td style="padding: 12px 0; vertical-align: top; width: 35%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <strong style="color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                                    ${field.label}${field.required ? '<span style="color: #ef4444;"> *</span>' : ''}
                                </strong>
                            </td>
                            <td style="padding: 12px 0; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                <div style="background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; padding: ${styles.fields.inputPadding}; color: #111827; font-size: ${styles.fields.inputFontSize}; word-break: break-word;">
                                    ${displayValue}
                                </div>
                            </td>
                        </tr>
                    `;
                    break;
            }
        });

        const submittedDate = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Form Submission - ${form.title || 'Form'}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${styles.container.backgroundColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
    
    <!-- Wrapper Table for Email Clients -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${styles.container.backgroundColor};">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Content Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: ${styles.container.maxWidth}; width: 100%; background-color: ${styles.card.backgroundColor}; border-radius: ${styles.card.borderRadius}; box-shadow: ${styles.container.boxShadow}; overflow: hidden;">
                    
                    <!-- Success Badge -->
                    <tr>
                        <td style="padding: ${styles.card.padding}; padding-bottom: 0;">
                            <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                ✓ Form Submitted Successfully
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="padding: ${styles.card.padding}; padding-top: 20px; padding-bottom: 10px;">
                            <h1 style="margin: 0; font-size: ${styles.title.fontSize}; font-weight: ${styles.title.fontWeight}; color: ${styles.title.color}; text-align: ${styles.title.textAlign}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.2;">
                                ${form.title || 'Form Submission'}
                            </h1>
                            ${
                                form.description
                                    ? `
                            <p style="margin: 8px 0 0 0; font-size: ${styles.description.fontSize}; color: ${styles.description.color}; text-align: ${styles.description.textAlign}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.5;">
                                ${form.description}
                            </p>
                            `
                                    : ''
                            }
                        </td>
                    </tr>
                    
                    <!-- Form Fields Table -->
                    <tr>
                        <td style="padding: 0 ${styles.card.padding};">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 2px solid ${styles.fields.inputBorderColor}; margin-top: 20px;">
                                ${fieldsHtml}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td style="padding: ${styles.card.padding}; padding-top: 30px; border-top: 1px solid ${styles.fields.inputBorderColor};">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                                        <p style="margin: 0; font-size: 13px; color: ${styles.description.color}; line-height: 1.5;">
                                            <strong>Submitted on:</strong><br>
                                            ${submittedDate}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                <!-- End Main Content Container -->
                
            </td>
        </tr>
    </table>
    <!-- End Wrapper Table -->
    
</body>
</html>
        `.trim();
    }


        async submitForm(
        formId: string,
        userId: number,
        email: string,
        dto: SubmitFormDto,
    ) {
        // Get form with fields
        const form = await this.formRepo.findOne({
            where: { form_id: parseInt(formId) },
            relations: ['fields'],
        });

        if (!form) {
            throw new NotFoundException(`Form with ID ${formId} not found`);
        }

        console.log("(form.fields:::", form.fields)

        // Sort fields by position
        const sortedFields: any = (form.fields || []).sort(
            (a, b) => a.field_order - b.field_order,
        );

        // Generate HTML email
        const htmlEmail = this.generateReadOnlyHtml(form, sortedFields, dto.data);

        // Save submission
        const submission = this.submissionRepo.create({
            form_id: formId,
            user_id: userId,
            submission_json: dto,
        });

        const saved = await this.submissionRepo.save(submission);

        // Send email to form owner
        try {
            await this.mailer.sendMail({
                to: email,
                subject: `Form Craft - Form Submitted Successfully`,
                html: htmlEmail,
            });
        } catch (error) {
            console.error('Failed to send email:', error);
            // Don't throw error - submission was saved successfully
        }

        return {
            success: true,
            message: 'Form submitted successfully',
            submission: saved,
        };
    }


    /**
     * Generate Full Embeddable HTML for a Form
     */
    private generateFullEmbedHTML(form: any, fields: IFormField[]): string {
        const styles = {
            container: { ...this.DEFAULT_STYLES.container, ...form.styles?.container },
            card: { ...this.DEFAULT_STYLES.card, ...form.styles?.card },
            title: { ...this.DEFAULT_STYLES.title, ...form.styles?.title },
            description: { ...this.DEFAULT_STYLES.description, ...form.styles?.description },
            fields: { ...this.DEFAULT_STYLES.fields, ...form.styles?.fields },
            button: { ...this.DEFAULT_STYLES.button, ...form.styles?.button },
        };

        // Generate field HTML
        const fieldsHTML = fields.map((field) => {
            const widthClass = field.width === 'half' 
                ? 'form-field-half' 
                : field.width === 'third' 
                ? 'form-field-third' 
                : 'form-field-full';

            switch (field.type) {
                case 'heading':
                    return `
                    <div class="${widthClass}">
                        <h2 style="font-size: 24px; font-weight: bold; color: ${styles.title.color}; margin: 0 0 8px 0;">
                            ${field.label}
                        </h2>
                    </div>`;

                case 'text':
                case 'email':
                case 'phone':
                case 'address':
                    return `
                    <div class="${widthClass}">
                        <label style="display: block; margin-bottom: 8px; color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                            ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                        </label>
                        <input 
                            type="${field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}"
                            name="${field.field_id}"
                            placeholder="${field.placeholder || ''}"
                            ${field.required ? 'required' : ''}
                            style="width: 100%; padding: ${styles.fields.inputPadding}; font-size: ${styles.fields.inputFontSize}; background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; outline: none;"
                        />
                    </div>`;

                case 'textarea':
                    return `
                    <div class="${widthClass}">
                        <label style="display: block; margin-bottom: 8px; color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                            ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                        </label>
                        <textarea 
                            name="${field.field_id}"
                            placeholder="${field.placeholder || ''}"
                            ${field.required ? 'required' : ''}
                            rows="4"
                            style="width: 100%; padding: ${styles.fields.inputPadding}; font-size: ${styles.fields.inputFontSize}; background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; outline: none; resize: vertical; font-family: inherit;"
                        ></textarea>
                    </div>`;

                case 'select':
                    const optionsHTML = (field.options || [])
                        .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
                        .join('\n                            ');
                    return `
                    <div class="${widthClass}">
                        <label style="display: block; margin-bottom: 8px; color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                            ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                        </label>
                        <select 
                            name="${field.field_id}"
                            ${field.required ? 'required' : ''}
                            style="width: 100%; padding: ${styles.fields.inputPadding}; font-size: ${styles.fields.inputFontSize}; background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; outline: none;"
                        >
                            <option value="">${field.placeholder || 'Select an option'}</option>
                            ${optionsHTML}
                        </select>
                    </div>`;

                case 'checkbox':
                    return `
                    <div class="${widthClass}">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input 
                                type="checkbox"
                                name="${field.field_id}"
                                ${field.required ? 'required' : ''}
                                style="width: 16px; height: 16px; cursor: pointer;"
                            />
                            <label style="color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight}; cursor: pointer;">
                                ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                            </label>
                        </div>
                    </div>`;

                case 'date':
                    return `
                    <div class="${widthClass}">
                        <label style="display: block; margin-bottom: 8px; color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                            ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                        </label>
                        <input 
                            type="date"
                            name="${field.field_id}"
                            ${field.required ? 'required' : ''}
                            style="width: 100%; padding: ${styles.fields.inputPadding}; font-size: ${styles.fields.inputFontSize}; background-color: ${styles.fields.inputBackgroundColor}; border: 1px solid ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; outline: none;"
                        />
                    </div>`;

                case 'signature':
                    return `
                    <div class="${widthClass}">
                        <label style="display: block; margin-bottom: 8px; color: ${styles.fields.labelColor}; font-size: ${styles.fields.labelFontSize}; font-weight: ${styles.fields.labelFontWeight};">
                            ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                        </label>
                        <div style="width: 100%; height: 120px; border: 2px dashed ${styles.fields.inputBorderColor}; border-radius: ${styles.fields.inputBorderRadius}; display: flex; align-items: center; justify-content: center; color: ${styles.fields.labelColor}; background-color: ${styles.fields.inputBackgroundColor};">
                            Signature Area
                        </div>
                        <input type="hidden" name="${field.field_id}" ${field.required ? 'required' : ''} />
                    </div>`;

                default:
                    return '';
            }
        }).join('\n');

        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${form.title || 'Form'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${styles.container.backgroundColor};
            padding: ${styles.container.padding};
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        
        .form-container {
            width: 100%;
            max-width: ${styles.container.maxWidth};
            background-color: ${styles.card.backgroundColor};
            border: ${styles.card.borderWidth} solid ${styles.card.borderColor};
            border-radius: ${styles.card.borderRadius};
            padding: ${styles.card.padding};
            box-shadow: ${styles.container.boxShadow};
        }
        
        .form-header {
            margin-bottom: 32px;
        }
        
        .form-title {
            font-size: ${styles.title.fontSize};
            font-weight: ${styles.title.fontWeight};
            color: ${styles.title.color};
            text-align: ${styles.title.textAlign};
            margin-bottom: 12px;
        }
        
        .form-description {
            font-size: ${styles.description.fontSize};
            color: ${styles.description.color};
            text-align: ${styles.description.textAlign};
        }
        
        .form-fields {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .form-field-full {
            width: 100%;
        }
        
        .form-field-half {
            width: 100%;
        }
        
        .form-field-third {
            width: 100%;
        }
        
        @media (min-width: 768px) {
            .form-field-half {
                width: calc(50% - 12px);
            }
            
            .form-field-third {
                width: calc(33.333% - 16px);
            }
        }
        
        .submit-button {
            width: 100%;
            padding: ${styles.button.padding};
            font-size: ${styles.button.fontSize};
            font-weight: ${styles.button.fontWeight};
            color: ${styles.button.textColor};
            background-color: ${styles.button.backgroundColor};
            border: none;
            border-radius: ${styles.button.borderRadius};
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        
        .submit-button:hover {
            background-color: ${styles.button.hoverBackgroundColor || '#2563eb'};
        }
        
        .submit-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .success-message {
            display: none;
            padding: 16px;
            background-color: #10b981;
            color: white;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 24px;
        }
        
        .error-message {
            display: none;
            padding: 16px;
            background-color: #ef4444;
            color: white;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="success-message" id="successMessage">
            Form submitted successfully!
        </div>
        
        <div class="error-message" id="errorMessage">
            Please fill in all required fields.
        </div>
        
        <div class="form-header">
            <h1 class="form-title">${form.title || 'Untitled Form'}</h1>
            ${form.description ? `<p class="form-description">${form.description}</p>` : ''}
        </div>
        
        <form id="mainForm" onsubmit="handleSubmit(event)">
            <div class="form-fields">
                ${fieldsHTML}
            </div>
            
            <button type="submit" class="submit-button" id="submitButton">
                Submit
            </button>
        </form>
    </div>
    
    <script>
        async function handleSubmit(event) {
            event.preventDefault();
            
            const form = event.target;
            const submitButton = document.getElementById('submitButton');
            const successMessage = document.getElementById('successMessage');
            const errorMessage = document.getElementById('errorMessage');
            
            // Hide messages
            successMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            
            // Validate form
            if (!form.checkValidity()) {
                errorMessage.style.display = 'block';
                form.reportValidity();
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            const payload = {
                form_id: '${form.form_id}',
                data: data,
                metadata: {
                    submitted_at: new Date().toISOString(),
                    num_fields: form.elements.length - 1,
                    form_title: '${form.title || 'Untitled Form'}',
                    form_description: '${form.description || ''}'
                }
            }
            
            // Disable submit button
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            
            try {
                const response = await fetch('${API_BASE_URL}/forms/${form.form_id}/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                
                if (response.ok) {
                    successMessage.style.display = 'block';
                    form.reset();
                    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
                console.error('Form submission error:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
            }
        }
    </script>
</body>
</html>`;

        return fullHTML;
    }


}
