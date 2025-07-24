import { NextApiRequest, NextApiResponse } from 'next'
import { verifyAccessToken } from '@/lib/auth'
import { getAllPosts } from '@/lib/controller'
import prisma from '@/lib/prisma';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

const updatePostSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

const deletePostSchema = z.object({
  id: z.number(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { page = '1', limit = '10', search = '', sortBy = 'createdAt', sortOrder = 'desc', category, tags } = req.query;
    let tagsArray: string[] | undefined = undefined;
    if (typeof tags === 'string') {
      tagsArray = tags.split(',');
    } else if (Array.isArray(tags)) {
      tagsArray = tags;
    }
    let sortByValue = sortBy;
    if (sortByValue === 'createdAt' || !sortByValue) sortByValue = 'id';
    const result = await getAllPosts({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string,
      sortBy: sortByValue as 'title' | 'id' | 'authorId',
      sortOrder: sortOrder as 'asc' | 'desc',
      includeAuthor: true,
      includeComments: true,
      category: category as string | undefined,
      tags: tagsArray,
    });
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  }

  // Require authentication for POST, PUT, DELETE
  if (["POST", "PUT", "DELETE"].includes(req.method!)) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const user = verifyAccessToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (req.method === 'POST') {
      // Validate input
      const parsed = postSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const { title, content, category, tags, published } = parsed.data;
      try {
        // Connect or create category
        let categoryId = undefined;
        if (category) {
          const cat = await prisma.category.upsert({
            where: { name: category },
            update: {},
            create: { name: category },
          });
          categoryId = cat.id;
        }
        // Connect or create tags
        let tagsData = undefined;
        if (tags && tags.length > 0) {
          tagsData = {
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          };
        }
        const data: any = {
          title,
          content,
          published: published ?? false,
          authorId: user.id,
          ...(tagsData && { tags: tagsData }),
        };
        if (categoryId) {
          data.categoryId = categoryId;
        }
        const post = await prisma.post.create({
          data,
          include: { category: true, tags: true },
        });
        return res.status(201).json({ success: true, data: post });
      } catch (error) {
        console.error('Create post error:', error);
        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    }

    if (req.method === 'PUT') {
      const parsed = updatePostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const { id, title, content, category, tags, published } = parsed.data;
      try {
        // Check ownership
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post || post.authorId !== user.id) {
          return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        // Handle category
        let categoryConnect = undefined;
        if (category) {
          const cat = await prisma.category.upsert({
            where: { name: category },
            update: {},
            create: { name: category },
          });
          categoryConnect = { connect: { id: cat.id } };
        }
        // Handle tags
        let tagsData = undefined;
        if (tags && tags.length > 0) {
          tagsData = {
            set: [], // remove all existing tags
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          };
        }
        const data: any = {
          ...(title && { title }),
          ...(content && { content }),
          ...(typeof published === 'boolean' && { published }),
          ...(tagsData && { tags: tagsData }),
        };
        if (categoryConnect) {
          data.category = categoryConnect;
        }
        const updated = await prisma.post.update({
          where: { id },
          data,
          include: { category: true, tags: true },
        });
        return res.status(200).json({ success: true, data: updated });
      } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to update post' });
      }
    }

    if (req.method === 'DELETE') {
      const parsed = deletePostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const { id } = parsed.data;
      try {
        // Check ownership
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post || post.authorId !== user.id) {
          return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        await prisma.post.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Post deleted' });
      } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to delete post' });
      }
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
