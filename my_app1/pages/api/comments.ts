import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { z } from 'zod';

// Zod schema for comment validation
const commentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  postId: z.number(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List all comments or filter by postId
    const { postId } = req.query;
    try {
      const where = postId ? { postId: Number(postId) } : {};
      const comments = await prisma.comment.findMany({
        where,
        include: { author: true, post: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ success: true, data: comments });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch comments' });
    }
  }

  // Authentication required for POST, PUT, DELETE
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  const user = verifyAccessToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  if (req.method === 'POST') {
    // Create a new comment
    try {
      const parsed = commentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const { content, postId } = parsed.data;
      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: user.id,
        },
      });
      return res.status(201).json({ success: true, data: comment });
    } catch (error) {
      console.error(error); // Add this line
      return res.status(500).json({ success: false, error: 'Failed to create post' });
    }
  }

  if (req.method === 'PUT') {
    // Update a comment (must be author)
    const { id, content } = req.body;
    if (!id || !content) {
      return res.status(400).json({ success: false, error: 'id and content are required' });
    }
    try {
      // Check ownership
      const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
      if (!comment || comment.authorId !== user.id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const updated = await prisma.comment.update({
        where: { id: Number(id) },
        data: { content },
      });
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete a comment (must be author)
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'id is required' });
    }
    try {
      const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
      if (!comment || comment.authorId !== user.id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      await prisma.comment.delete({ where: { id: Number(id) } });
      return res.status(200).json({ success: true, message: 'Comment deleted' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
