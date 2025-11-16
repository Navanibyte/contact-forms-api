/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Sign } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { Auth } from 'typeorm';

import * as bcrypt from 'bcryptjs';

type AuthInput = { username: string; password: string };
type SignInData = { userId: number; username: string };
type AuthResult = { accessToken: string; userId: number; username: string };

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService

    ) { }


    async register(email: string, password: string) {
        const hashed = await bcrypt.hash(password, 10);
        return this.userService.create({ email, password: hashed });
    }




    async autheticate(input: AuthInput): Promise<AuthResult> {
        const user = await this.validateUser(input);

        if (!user) {
            throw new UnauthorizedException();
        }

        return this.signIn(user);

    }

    async validateUser(input: AuthInput): Promise<SignInData | null> {
        const user = await this.userService.findUserByName(input.username);
        if (user && user.password === input.password) {
            return {
                userId: user.id,
                username: user.email
            }
        }
        return null;
    }


    async signIn(user: SignInData): Promise<AuthResult> {
        const payload = { username: user.username, sub: user.userId };

        const accessToken = this.jwtService.sign(payload);

        return { accessToken, userId: user.userId, username: user.username }
    }
}
