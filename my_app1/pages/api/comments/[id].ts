import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const commentId = parseInt(id as string, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ success: false, error: 'Invalid comment id' });
    }
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          author: { select: { id: true, name: true, email: true } },
          post: { select: { id: true, title: true } }
        }
      });
      if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }
      return res.status(200).json({ success: true, data: comment });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch comment' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
