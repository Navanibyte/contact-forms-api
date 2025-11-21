/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOauthStrategyService } from './services/oauth.strategies/google-oauth.strategy/google-oauth.strategy.service';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from './guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './services/jwt/jwt.service';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'google', session: true }),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '24h' },
        }),
    ],
    providers: [AuthService, GoogleOauthStrategyService, AuthGuard, JwtService],
    controllers: [AuthController],
    exports: [JwtService],
})
export class AuthModule { }