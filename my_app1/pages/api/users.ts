import { NextApiRequest, NextApiResponse } from 'next'
import { getAllUsers } from '@/lib/controller'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const result = await getAllUsers()
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data, pagination: result.pagination })
    } else {
      return res.status(500).json({ success: false, error: result.error })
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
} 
