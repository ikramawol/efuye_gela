import jwt from 'jsonwebtoken';
import { parse } from 'cookie';


export type JwtPayload = {
    id: number;
    email: string;
};

export function parseAuthCookie(cookieHeader: string | undefined): string | null {
    if(!cookieHeader) return null;
    const cookies = parse(cookieHeader);
    return cookies.authToken || null;
}

export function generateJwt(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret, { expiresIn: '7d' });
}

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
