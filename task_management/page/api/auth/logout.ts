import { NextApiRequest, NextApiResponse } from 'next'
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth.middleware'

export async function POST(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Get user info for logging
    const userEmail = req.user?.email || 'unknown'
    const userId = req.user?.id || 'unknown'
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
      details: {
        userId,
        userEmail,
        logoutTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }
  
  // Use auth middleware to ensure user is logged in
  return authMiddleware(POST)(req as AuthenticatedRequest, res)
}
