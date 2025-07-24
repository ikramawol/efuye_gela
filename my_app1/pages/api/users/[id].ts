import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const userId = parseInt(id as string, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          posts: true,
          comments: true
        }
      });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
} 