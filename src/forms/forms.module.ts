/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';

import { Form } from './entity/form.entity';
import { FormField } from './entity/form-field.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Form, FormField])],
    controllers: [FormsController],
    providers: [FormsService],
    exports: [FormsService],

})
export class FormsModule { }
