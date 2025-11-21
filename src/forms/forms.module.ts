/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';

import { Form } from './entity/form.entity';
import { FormField } from './entity/form-field.entity';
import { FormSubmission } from './entity/form-submission.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from 'src/auth/auth.module';
import { AuthGuard } from 'src/auth/guards/auth.guard';


@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([Form, FormField, FormSubmission]),
        MailerModule.forRoot({
            transport: {
                host: process.env.EMAIL_HOST,   // Replace with your SMTP host
                port: Number(process.env.EMAIL_PORT),           // Replace with your SMTP port
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,   // Replace with your SMTP user
                    pass: process.env.EMAIL_PASS,      // Replace with your SMTP password
                }
            },
        }),
    ],
    controllers: [FormsController],
    providers: [FormsService, AuthGuard],
    exports: [FormsService],

})
export class FormsModule { }
