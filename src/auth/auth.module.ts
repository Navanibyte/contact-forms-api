/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOauthStrategyService } from './services/oauth.strategies/google-oauth.strategy/google-oauth.strategy.service';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from './guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './services/jwt/jwt.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'google', session: true }),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '24h' },
        }),

          MailerModule.forRoot({
                    transport: {
                        host: process.env.EMAIL_HOST,   // Replace with your SMTP host
                        port: Number(process.env.EMAIL_PORT),           // Replace with your SMTP port
                        secure: false,
                        auth: {
                            user: process.env.EMAIL_USER,   // Replace with your SMTP user
                            pass: process.env.EMAIL_PASS,      // Replace with your SMTP password
                        }
                    },
                }),

    ],
    providers: [AuthService, GoogleOauthStrategyService, AuthGuard, JwtService],
    controllers: [AuthController],
    exports: [JwtService],
})
export class AuthModule { }