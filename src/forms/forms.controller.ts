/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('forms')
export class FormsController {
    constructor(private readonly formsService: FormsService) { }

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createFormDto: CreateFormDto, @Request() request: any) {
        return this.formsService.create(createFormDto, request.user.userId);
    }

    @UseGuards(AuthGuard)
    @Get('')
    findAllByUser(@Request() request: any) {
        return this.formsService.findAllByUser(request.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.formsService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.formsService.remove(id);
    }
}
