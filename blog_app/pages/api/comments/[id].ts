import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth-middleware';
import { z } from 'zod';

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const commentId = parseInt(id as string, 10);
  
  if (isNaN(commentId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid comment Id'
    });
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
      return res.status(404).json({
        success: false,
        error: "Comment not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch comment'
    });
  }
}

async function handlePUT(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const commentId = parseInt(id as string, 10);

  if (isNaN(commentId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid comment Id'
    });
  }

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: 'User authentication required to update a comment' 
    });
  }

  const parsed = updateCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues });
  }

  const { content } = parsed.data;

  try {
    // Check ownership
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only update your own comments' });
    }
    
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: { select: { id: true, name: true, email: true } },
        post: { select: { id: true, title: true } }
      }
    });
    
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update comment' });
  }
}

async function handleDELETE(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const commentId = parseInt(id as string, 10);
  
  if (isNaN(commentId)) {
    return res.status(400).json({ success: false, error: 'Invalid comment id' });
  }

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: 'User authentication required to delete a comment' 
    });
  }
  
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only delete your own comments' });
    }
    
    await prisma.comment.delete({ where: { id: commentId } });
    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGET(req, res);
  }
  
  if (req.method === 'PUT') {
    return authMiddleware(handlePUT)(req as AuthenticatedRequest, res);
  }
  
  if (req.method === 'DELETE') {
    return authMiddleware(handleDELETE)(req as AuthenticatedRequest, res);
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
