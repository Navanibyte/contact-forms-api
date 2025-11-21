/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable prettier/prettier */
import { JwtPayload } from "jsonwebtoken";

export interface IjwtPayload {
    userId: number;
    email: string;
    type?: 'access' | 'partial';
    twoFactorVerified?: boolean;
}

export interface ItokenValidationResult {
    isValid: boolean;
    payload?: JwtPayload | any;
    error?: string;
}

export interface IuserData {
    id: number;
    email: string;
    name: string;
    twoFactorEnabled?: any;
}