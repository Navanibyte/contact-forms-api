/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsBoolean, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateFormFieldDto {
    @IsString()
    label: string;

    @IsOptional()
    @IsNumber()
    field_order?: number;

    @IsOptional()
    @IsString()
    placeholder?: string;

    @IsString()
    type: string; // text, email, checkbox, etc.

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsArray()
    options?: string[];
}
