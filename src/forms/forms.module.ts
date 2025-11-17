/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';

import { Form } from './entity/form.entity';
import { FormField } from './entity/form-field.entity';
import { FormSubmission } from './entity/form-submission.entity';
import { MailerModule } from '@nestjs-modules/mailer';


@Module({
    imports: [
        TypeOrmModule.forFeature([Form, FormField, FormSubmission]),
        MailerModule.forRoot({
            transport: {
                host: 'smtp.gmail.com',   // Replace with your SMTP host
                port: 587,
                secure: false,
                auth: {
                    user: 'navanik81@gmail.com',   // Replace with your SMTP user
                    pass: 'rhah mnvg aypf pply',      // Replace with your SMTP password
                },
            },
        }),
    ],
    controllers: [FormsController],
    providers: [FormsService],
    exports: [FormsService],

})
export class FormsModule { }
