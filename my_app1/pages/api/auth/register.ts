import { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword, generateAccessToken } from '@/lib/auth'
import { createUser, getUserByEmail } from '@/lib/controller'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser.success && existingUser.data) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' })
    }

    const hashedPassword = await hashPassword(password)
    const result = await createUser(email, name, hashedPassword)

    if (result.success && result.data) {
      const accessToken = generateAccessToken({
        id: result.data.id,
        email: result.data.email
      })
      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.data.id,
            email: result.data.email,
            name: result.data.name
          },
          accessToken
        },
        message: 'User registered successfully'
      })
    } else {
      return res.status(500).json({ success: false, error: result.error })
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 