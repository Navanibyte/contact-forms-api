/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { IuserData, ItokenValidationResult } from '../interfaces/jwt.interfaces';

@Injectable()
export class JwtService {
    private readonly logger = new Logger(JwtService.name);

    constructor(private readonly nestJwtService: NestJwtService) { }

    createAccessToken(userData: IuserData): string {
        this.logger.log(`Creating access token for user: ${userData.email}`);

        const payload: JwtPayload = {
            userId: userData.id,
            email: userData.email,
            type: 'access',
            twoFactorVerified: !userData.twoFactorEnabled,
        };

        return this.nestJwtService.sign(payload);
    }

    createPartialToken(email: string): string {
        this.logger.log(`Creating partial token for user: ${email}`);

        const payload: JwtPayload = {
            userId: 0,
            email: email,
            type: 'partial',
            twoFactorVerified: false,
        };

        return this.nestJwtService.sign(payload, {
            expiresIn: '15m',
        });
    }

    validateToken(token: string): ItokenValidationResult {
        try {
            const payload = this.nestJwtService.verify<JwtPayload>(token);
            this.logger.log(`Token validated for user: ${payload.email}`);

            return {
                isValid: true,
                payload,
            };
        } catch (error) {
            this.logger.error(`Token validation failed: ${error.message}`);

            return {
                isValid: false,
                error: this.getTokenError(error),
            };
        }
    }

    validateTokenExpiry(tokenData: JwtPayload): boolean {
        this.logger.log(`Validating token expiry for user: ${tokenData.email}`);
        return true;
    }

    private getTokenError(error: any): string {
        if (error.name === 'TokenExpiredError') {
            return 'Token has expired';
        } else if (error.name === 'JsonWebTokenError') {
            return 'Invalid token';
        } else if (error.name === 'NotBeforeError') {
            return 'Token not yet active';
        } else {
            return 'Token validation failed';
        }
    }
}