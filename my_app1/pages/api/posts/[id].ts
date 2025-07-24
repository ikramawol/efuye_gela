import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const postId = parseInt(id as string, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: { select: { id: true, name: true, email: true } },
          comments: {
            include: {
              author: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          category: true,
          tags: true
        }
      });
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      return res.status(200).json({ success: true, data: post });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch post' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
