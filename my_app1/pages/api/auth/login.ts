import { NextApiRequest, NextApiResponse } from 'next'
import { comparePassword } from '@/lib/auth'
import { generateJwt } from '@/utils/jwt'
import prisma from '@/lib/prisma'

export default async function handlerPOST(req: NextApiRequest, res: NextApiResponse) {
  
  try {
    const { email, password } = req.body

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'User does not exist' })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password || '')
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Incorrect password' })
    }

    // Generate access token
    const accessToken = generateJwt({
      id: user.id,
      email: user.email
    })

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        accessToken
      },
      message: 'Login successful'
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 