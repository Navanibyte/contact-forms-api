/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";



@Controller("auth-v2")
export class PassportAuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(@Body() input: { username: string; password: string }) {
        return this.authService.autheticate(input);
    }

    @Get("me")
    async me(@Request() request: any): Promise<any> {
        return request?.user;
    }
}
