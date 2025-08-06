import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { NextRequest} from 'next/server'
import { parse } from 'cookie'

export type JwtPayload = {
    id: number;
    email: string;
}

export async function parseAuthCookies(cookieHeader: string | undefined ): Promise<string | null> {
    if (!cookieHeader) return null;
    const cookies = parse(cookieHeader);
    return await cookies.authToken || null;
}

export const getTokenFromRequest = (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer')){
        return authHeader.substring(7);
    }
    return null;
}

export function generateJwt(payload: JwtPayload) : string {
    const secret = process.env.JWT_Secret;
    if (!secret) {
        throw new Error('JWT_Secret is not defined');
    }

    return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        const secret = process.env.JWT_SECRET;
        if(!secret) {
            console.error('JWT_SECRET is not defined');
            return null;
        }
        return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
}

export const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}