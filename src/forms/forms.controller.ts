/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request, Put, Req, Res } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { AuthGuard } from "../auth/guards/auth.guard";
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { Response } from 'express';

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
        console.log("DEBUG → User ID from request:", request.user.userId);
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

    // @UseGuards(AuthGuard)
    @Post(':id/submit')
    async submit(
        @Param('id') formId: string,
        @Body() dto: SubmitFormDto,
        @Req() req: any,
    ) {
// Get owner userId + email from the DB
        const owner = await this.formsService.getFormOwnerEmail(Number(formId));

        console.log("DEBUG → EMAIL_USER =", process.env.EMAIL_USER);
        console.log("DEBUG → EMAIL_PASS =", process.env.EMAIL_PASS);

        console.log("DEBUG → Form Owner:", owner);
        const userId = owner.userId; // logged-in user
        const email = owner.email; // logged-in user's email

        return this.formsService.submitForm(formId, userId, email, dto);
    }

    @Get(':id/html')
   async serveStaticHtml(@Param('id') id: number, @Res() res: Response) {
    console.log("Serving static HTML for form ID:", id);
    const form = await this.formsService.findOne(id);

    if (!form || !form.embedded_code) {
        return res.status(404).send("No HTML found for this form");
    }

    // Wrap your HTML so the browser treats it as a page
    const completeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <title>${form.title ?? "Form Page"}</title>
            <style>
                body { margin:0; padding:0; font-family:Arial; }
            </style>
        </head>
        <body>
            ${form.embedded_code}
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(completeHtml);
  }

  // Get all submissions for a form
   @Get(':formId/submissions')
    getFormSubmissions(@Param('formId') formId: string) {
        console.log("Fetching submissions for form ID:", formId);
      return this.formsService.getFormSubmissions(formId);
    }

}
