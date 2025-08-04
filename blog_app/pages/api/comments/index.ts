import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth-middleware';
import { z } from 'zod';

// Zod schema for comment validation
const commentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  postId: z.number(),
});

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query;
  
  // Require postId to get comments for a specific post
  if (!postId) {
    return res.status(400).json({ 
      success: false, 
      error: 'postId is required to fetch comments' 
    });
  }

  const postIdNum = parseInt(postId as string, 10);
  if (isNaN(postIdNum)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid postId' 
    });
  }

  try {
    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postIdNum }
    });

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }

    // Get comments for the specific post
    const comments = await prisma.comment.findMany({
      where: { postId: postIdNum },
      include: { 
        author: { select: { id: true, name: true, email: true } },
        post: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ 
      success: true, 
      data: comments,
      post: {
        id: post.id,
        title: post.title
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch comments' 
    });
  }
}

async function handlePOST(req: AuthenticatedRequest, res: NextApiResponse) {
  // Create a new comment
  try {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues });
    }
    
    const { content, postId } = parsed.data;
    
    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'User authentication required to create a comment' 
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        post: { select: { id: true, title: true } }
      }
    });
    
    return res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create comment' 
    });
  }
}

// Default export function that handles all HTTP methods
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGET(req, res);
  }
  
  if (req.method === 'POST') {
    return authMiddleware(handlePOST)(req as AuthenticatedRequest, res);
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

  