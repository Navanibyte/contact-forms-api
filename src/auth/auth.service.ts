/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
    BadRequestException,
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { SignUpDto } from './Dto/signUp.dto';
import { EntityManager } from 'typeorm';
import { PasswordUtils } from './services/utils/Password.utils';
import { JwtService } from './services/jwt/jwt.service';
import { IuserData } from './services/interfaces/jwt.interfaces';
import { LoginDto } from './Dto/login.dto';
import { IgoogleRequestUser } from './services/interfaces/google.interface';
import { IouthDetails } from './services/interfaces/oauth.interface';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private static readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly entityManager: EntityManager,
        private jwtService: JwtService,
        private mailer: MailerService,
        
    ) { }

    async signUp(signUpDto: SignUpDto) {
        try {
            const response = await this.entityManager.transaction(
                async (transactionalEntityManager) => {
                    const isUserExists = await this.checkUserExists(
                        transactionalEntityManager,
                        signUpDto.email,
                    );
                    if (isUserExists.length > 0) {
                        throw new ConflictException('User already exists');
                    }

                    const passwordValidationResult =
                        PasswordUtils.getPasswordValidationDetails(signUpDto.password);
                    if (!passwordValidationResult.isValid) {
                        throw new BadRequestException('Password is not strong enough');
                    }

                    // Hash password
                    const passwordHash = await PasswordUtils.hashPassword(
                        signUpDto.password,
                    );

                    console.log("passwordHash---->", passwordHash);

                    // Insert into users table
                    const userId = await this.insertUserDetails(
                        transactionalEntityManager,
                        signUpDto.email,
                        signUpDto.name,
                        passwordHash
                    );

                    // Insert into user_jwt_auth table
                    await this.insertJwtAuthDetails(
                        transactionalEntityManager,
                        userId,
                        passwordHash,
                    );

                    // Get created user
                    const user = await this.getUserDetails(
                        transactionalEntityManager,
                        userId,
                        signUpDto.email,
                    );
                    // Generate JWT token
                    const accessToken: any = this.jwtService.createAccessToken({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        twoFactorEnabled: user.twoFactorEnabled
                            ? user.twoFactorEnabled
                            : null,
                    });

                    return {
                        success: true,
                        message: 'User registered successfully',
                        data: { accessToken },
                    };
                },
            );
            return response;
        } catch (error) {
            console.log('error---->', error.mes);
            if (error instanceof ConflictException) {
                throw error;
            }

            throw new BadRequestException('Registration failed. Please try again.');
        }
    }

    async checkUserExists(
        entityManager: EntityManager,
        email: string,
    ): Promise<any> {
        try {
            const query =
                'SELECT email, name, id, password FROM custom_form.user WHERE email = ?';
            const user = await entityManager.query(query, [email]);
            return user;
        } catch (error) {
            throw error;
        }
    }

    async insertUserDetails(
        entityManager: EntityManager,
        email: string,
        name: string,
        password: string,
    ) {
        try {
            const query = 'INSERT INTO custom_form.user (email, name, password) VALUES (?, ?, ?)';
            const userResult = await entityManager.query(query, [email, name, password]);

            return userResult.insertId;
        } catch (error) {
            throw error;
        }
    }

    async insertJwtAuthDetails(
        entityManager: EntityManager,
        userId: number,
        passwordHash: string,
    ): Promise<void> {
        try {
            const query =
                'INSERT INTO user_jwt_auth (user_id, password_hash) VALUES (?, ?)';
            const jwtAuthResult = await entityManager.query(query, [
                userId,
                passwordHash,
            ]);
            return jwtAuthResult.insertId;
        } catch (error) {
            throw error;
        }
    }

    async getUserDetails(
        entityManager: EntityManager,
        userId: number,
        email: string,
    ) {
        try {
            const query =
                'SELECT id, email, name FROM custom_form.user WHERE id = ? AND email=?';
            const user = await entityManager.query(query, [userId, email]);
            return user[0];
        } catch (error) {
            throw error;
        }
    }

    async getJwtAuthDetails(
        entityManager: EntityManager,
        userId: number,
    ): Promise<any> {
        try {
            const query =
                'SELECT password_hash AS passwordHash FROM custom_form.user_jwt_auth WHERE user_id = ?';
            const jwtAuth = await entityManager.query(query, [userId]);
            return jwtAuth;
        } catch (error) {
            console.log('error----> in getJwtAuthDetails', error);
             throw error;
        }
    }

    async logIn(loginDto: LoginDto) {
        try {
            console.log("LoginDto:", loginDto);
            const isUserExists = await this.checkUserExists(
                this.entityManager,
                loginDto.email,
            );
            if (isUserExists.length === 0) {
                throw new NotFoundException('User not found');
            }

            const jwtAuthDetails = await this.getJwtAuthDetails(
                this.entityManager,
                isUserExists[0].id,
            );
            if (!(jwtAuthDetails.length > 0)) {
                throw new NotFoundException('User details not found');
            }

            const isPasswordValid = await PasswordUtils.verifyPassword(
                loginDto.password,
                jwtAuthDetails[0].passwordHash,
            );
            if (!isPasswordValid) {
                throw new BadRequestException('Invalid Crenditials.');
            }
            const user = await this.getUserDetails(
                this.entityManager,
                isUserExists[0].id,
                loginDto.email,
            );
            // Generate JWT token
            const accessToken = this.jwtService.createAccessToken({
                id: user.id,
                email: user.email,
                name: user.name,
                twoFactorEnabled: user.twoFactorEnabled ? user.twoFactorEnabled : null,
            });

            console.log('accessToken---->', accessToken);

            return {
                message: 'Logged In Successfully',
                status: HttpStatus.OK,
                data: {
                    access_token: accessToken,
                    user_id: isUserExists[0].user_id,
                }
                // token: accessToken,
            };
        } catch (error) {
            console.log('error---->', error);
            throw error;
        }
    }

    async googleLogin(user: IgoogleRequestUser) {
        try {
            const response = await this.entityManager.transaction(
                async (transactionalEntityManager) => {
                    const isUserExists = await this.checkUserExists(
                        transactionalEntityManager,
                        user.email,
                    );

                    if (isUserExists && isUserExists.length > 0) {
                        const checkGoogleUserExists =
                            await this.getGoogleUserDetailsExsists(
                                user.providers,
                                user.providerId,
                                transactionalEntityManager,
                            );
                        if (checkGoogleUserExists && checkGoogleUserExists.length > 0) {
                            const accessToken = this.jwtService.createAccessToken({
                                id: isUserExists[0].id,
                                email: user.email,
                                name: `${user.firstName}${user.lastName}`,
                                twoFactorEnabled: isUserExists[0].twoFactorEnabled
                                    ? isUserExists[0].twoFactorEnabled
                                    : null,
                            });
                            return {
                                success: true,
                                message: 'User Signed successfully',
                                data: { accessToken },
                            };
                        } else {
                            await this.createGoogleOuathuser(
                                user,
                                isUserExists[0].id,
                                transactionalEntityManager,
                            );
                            const accessToken = this.jwtService.createAccessToken({
                                id: isUserExists[0].id,
                                email: user.email,
                                name: `${user.firstName}${user.lastName}`,
                                twoFactorEnabled: isUserExists[0].twoFactorEnabled
                                    ? isUserExists[0].twoFactorEnabled
                                    : null,
                            });
                            return {
                                success: true,
                                message: 'User Signed successfully',
                                data: { accessToken },
                            };
                        }
                    } else {
                        const userId = await this.insertUserDetails(
                            transactionalEntityManager,
                            user.email,
                            `${user.firstName} ${user.lastName}`,
                            isUserExists[0].password,

                        );

                        await this.createGoogleOuathuser(
                            user,
                            userId,
                            transactionalEntityManager,
                        );

                        const newGoogleUser = await this.getUserDetails(
                            transactionalEntityManager,
                            userId,
                            user.email,
                        );

                        const accessToken = this.jwtService.createAccessToken({
                            id: userId,
                            email: user.email,
                            name: `${user.firstName}${user.lastName}`,
                            twoFactorEnabled: newGoogleUser.twoFactorEnabled
                                ? newGoogleUser.twoFactorEnabled
                                : null,
                        });
                        return {
                            success: true,
                            message: 'User Signed successfully',
                            data: { accessToken },
                        };
                    }
                },
            );

            return {
                statusCode: 200,
                ...response,
            };
        } catch (error) {
            throw error;
        }
    }

    async createGoogleOuathuser(
        user: IgoogleRequestUser,
        userId: number,
        entityManager: EntityManager,
    ) {
        try {
            const userDetails: IouthDetails = {
                access_token: user.accessToken,
                provider: user.providers,
                provider_id: user.providerId,
                user_id: userId,
            };
            const keysData = Object.keys(userDetails);
            const columnValues = Object.values(userDetails);

            const columnData = keysData.join(', ');

            const values = keysData.map(() => `?`).join(', ');
            console.log("columnData---->", columnData);
            console.log("values---->", values);
            const query = `INSERT INTO user_oauth_auth (${columnData}) VALUES (${values})`;
            const userResult = await entityManager.query(query, columnValues);
            return userResult.insertId;
        } catch (error) {
            console.log('error---->', error);
            throw error;
        }
    }

    async getGoogleUserDetailsExsists(
        provider: string,
        providerId: string,
        entityManager: EntityManager,
    ) {
        try {
            const query = `SELECT id,user_id AS userId, provider, provider_id AS providerId FROM user_oauth_auth WHERE provider=? AND provider_id=?`;
            const user = await entityManager.query(query, [provider, providerId]);
            return user;
        } catch (error) {
            console.error("Error in getGoogleUserDetailsExsists:", error);
            throw error;
        }
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
    try {
        const isUserExists = await this.checkUserExists(
            this.entityManager,
            email,
        );

        console.log("isUserExists---->", isUserExists);

        if (isUserExists.length === 0) {
            throw new NotFoundException('User with this email does not exist');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token expiry (1 hour from now)
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1);

        // Update user with reset token
        await this.updateResetToken(
            this.entityManager,
            isUserExists[0].id,
            hashedToken,
            tokenExpiry,
        );

        // Send email with reset link
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await this.mailer.sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        });

        return { message: 'Password reset link sent to your email' };
    } catch (error) {
        AuthService.logger.error('Error in forgotPassword:', error);
        if (error instanceof NotFoundException) {
            throw error;
        }
        throw new BadRequestException('Failed to process password reset request');
    }
}

async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.getUserByResetToken(
            this.entityManager,
            hashedToken,
        );

        if (!user || user.length === 0) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        // Check if token is expired
        const now = new Date();
        if (new Date(user[0].resetTokenExpiry) < now) {
            throw new BadRequestException('Reset token has expired');
        }

        // Validate password
        const passwordValidationResult =
            PasswordUtils.getPasswordValidationDetails(newPassword);
        if (!passwordValidationResult.isValid) {
            throw new BadRequestException('Password is not strong enough');
        }

        // Hash new password
        const passwordHash = await PasswordUtils.hashPassword(newPassword);

        // Update password and clear reset token
        await this.updatePassword(
            this.entityManager,
            user[0].id,
            passwordHash,
        );

        // Update JWT auth table
        await this.updateJwtAuthPassword(
            this.entityManager,
            user[0].id,
            passwordHash,
        );

        return { message: 'Password reset successful' };
    } catch (error) {
        AuthService.logger.error('Error in resetPassword:', error);
        if (error instanceof BadRequestException) {
            throw error;
        }
        throw new BadRequestException('Failed to reset password');
    }
}

// Helper methods for database operations:

async updateResetToken(
    entityManager: EntityManager,
    userId: number,
    hashedToken: string,
    tokenExpiry: Date,
): Promise<void> {
    try {
        const query = `
            UPDATE custom_form.user 
            SET reset_token = ?, reset_token_expiry = ? 
            WHERE id = ?
        `;
        await entityManager.query(query, [hashedToken, tokenExpiry, userId]);
    } catch (error) {
        AuthService.logger.error('Error in updateResetToken:', error);
        throw error;
    }
}

async getUserByResetToken(
    entityManager: EntityManager,
    hashedToken: string,
): Promise<any> {
    try {
        const query = `
            SELECT id, email, reset_token_expiry AS resetTokenExpiry 
            FROM custom_form.user 
            WHERE reset_token = ?
        `;
        const user = await entityManager.query(query, [hashedToken]);
        return user;
    } catch (error) {
        AuthService.logger.error('Error in getUserByResetToken:', error);
        throw error;
    }
}

async updatePassword(
    entityManager: EntityManager,
    userId: number,
    passwordHash: string,
): Promise<void> {
    try {
        const query = `
            UPDATE custom_form.user 
            SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
            WHERE id = ?
        `;
        await entityManager.query(query, [passwordHash, userId]);
    } catch (error) {
        AuthService.logger.error('Error in updatePassword:', error);
        throw error;
    }
}

async updateJwtAuthPassword(
    entityManager: EntityManager,
    userId: number,
    passwordHash: string,
): Promise<void> {
    try {
        const query = `
            UPDATE custom_form.user_jwt_auth 
            SET password_hash = ? 
            WHERE user_id = ?
        `;
        await entityManager.query(query, [passwordHash, userId]);
    } catch (error) {
        AuthService.logger.error('Error in updateJwtAuthPassword:', error);
        throw error;
    }
}
}