/* eslint-disable prettier/prettier */


import * as bcrypt from 'bcryptjs';

export class PasswordUtils {
    private static readonly saltRounds = 12;

    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.saltRounds);
    }

    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static getPasswordValidationDetails(password: string): {
        isValid: boolean;
        details: {
            minLength: boolean;
            hasUpperCase: boolean;
            hasLowerCase: boolean;
            hasNumber: boolean;
            hasSpecialChar: boolean;
        };
    } {
        const details = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };

        return {
            isValid: Object.values(details).every(Boolean),
            details,
        };
    }
}