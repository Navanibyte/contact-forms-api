/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService, private userService: UsersService, private jwtService: JwtService) { }
    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(@Body() input: { username: string; password: string }) {
        const user = await this.userService.findUserByName(input.username);
        if (!user) throw new UnauthorizedException();

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) throw new UnauthorizedException();

        const token = this.jwtService.sign({ username: user.email, sub: user.id }, { expiresIn: '1d' });

        return { accessToken: token, userId: user.id, username: user.email };

    }

    @HttpCode(HttpStatus.OK)
    @Post("register")
    async register(@Body() input: { email: string; password: string }) {
        return this.authService.register(input.email, input.password);
    }

    @UseGuards(AuthGuard)
    @Get("me")
    me(@Request() request: any): any {
        return request?.user;
    }
}
