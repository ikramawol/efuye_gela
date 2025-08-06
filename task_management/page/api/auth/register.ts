import { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword, generateJwt } from '@/utils/jwt'
import { createUser, getUserByEmail } from '@/lib/auth.controller'

export default async function POST(req: NextApiRequest, res: NextApiResponse){
    try {
        const { email, password, name } = req.body
        if (!email || !password){
            return res.status(400).json({ success: false, error: 'Email and password are required'})
        }

        const existingUser = await getUserByEmail(email)
        if (existingUser.success && existingUser.data){
            return res.status(409).json({ 
                success: false,
                error: 'User with this email already exists'
            })
        }
        const hash = await hashPassword(password)
        const result = await createUser(email, name, hash )
        
        if (result.success && result.data){
            const accessToken = generateJwt({
                id: result.data.id,
                email: result.data.email
            })
        
            return res.status(200).json({
                success: true,
                message: 'User registration successful',
                data: {
                    accessToken,
                    user: {
                        id: result.data.id,
                        email: result.data.email,
                        name: result.data.name
                    }
                }
            })
        } else {
            return res.status(500).json({
                success: false,
                error: result.error
            })
        }

    }catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        })
    }
}