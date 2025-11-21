/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./Dto/signUp.dto";
import { GoogleOAuthGuard } from "./services/oauth.strategies/google-oauth.strategy/google-oauth.guard";
import { LoginDto } from "./Dto/login.dto";
import { IgoogleRequestUser } from "./services/interfaces/google.interface";

@Controller("/api/auth/")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("sign-up")
    async signUp(@Body() signUpDto: SignUpDto) {
        console.log("SignUpDto:", signUpDto);
        return this.authService.signUp(signUpDto);
    }

    @Post("log-in")
    async signIn(@Body() loginDto: LoginDto) {
        return this.authService.logIn(loginDto);
    }

    @Get("login/google")
    @UseGuards(GoogleOAuthGuard)
    async loginGoogle() { }

    @Get("callback/google")
    @UseGuards(GoogleOAuthGuard)
    async googleCallback(@Request() req: any) {
        const user = req?.user as IgoogleRequestUser;
        return this.authService.googleLogin(user);
    }
}
