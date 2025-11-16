/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { IsString, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFormFieldDto } from "./create-form-field.dto";

export class CreateFormDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    embedded_code?: string;

    @IsOptional()
    @IsObject()
    styles?: Record<string, any>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFormFieldDto)
    fields: CreateFormFieldDto[];

    @IsOptional()
    userId?: number;
}
