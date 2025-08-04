import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { NextRequest, NextResponse} from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '24h'

// Generate Access Token
export const generateAccessToken = (payload: { userId: number; username: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verify Access Token
export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string }
  } catch (error) {
    return null
  }
}

// Hash Password
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10)
}

// Compare Password
export const comparePassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword)
}

// Extract token from request headers
export const getTokenFromRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
} 

