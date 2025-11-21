/* eslint-disable prettier/prettier */
// import { Injectable } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { AuthGuard } from "@nestjs/passport";









// src/auth/guards/google-oauth.guard.ts

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
    constructor() {
        super({
            prompt: 'select_account',
            session: false,
            accessType: 'offline',
        });
    }
}