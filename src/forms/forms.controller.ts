/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request, Put, Req } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';

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

    @UseGuards(AuthGuard)
    @Put(':id')
    update(
        @Param('id') id: number,
        @Body() updateFormDto: UpdateFormDto,
        @Request() req: any
    ) {
        return this.formsService.update(id, updateFormDto, req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.formsService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.formsService.remove(id);
    }

    @UseGuards(AuthGuard)
    @Post(':id/submit')
    async submit(
        @Param('id') formId: string,
        @Body() dto: SubmitFormDto,
        @Req() req: any,
    ) {
        const userId = req.user.userId; // logged-in user
        const email = req.user.username; // logged-in user's email

        return this.formsService.submitForm(formId, userId, email, dto);
    }
}
