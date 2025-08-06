import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { parse } from 'cookie';
import { NextRequest } from 'next/server';

export type JwtPayload = {
    id: number;
    email: string;
};

// Parse token from cookies
export function parseAuthCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const cookies = parse(cookieHeader);
    return cookies.authToken || null;
}

// Parse token from Authorization Header
export const getTokenFromRequest = (request: NextRequest) => {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
};

// Generate JWT Token
export function generateJwt(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// Verify JWT Token
export function verifyJwt(token: string): JwtPayload | null {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET is not configured');
            return null;
        }
        return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

// Hash Password
export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
}

// Compare Password
export const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}
