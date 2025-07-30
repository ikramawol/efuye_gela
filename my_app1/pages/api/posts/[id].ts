import { NextApiRequest, NextApiResponse } from "next";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

async function handleDELETE(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Validate id
  const postId = parseInt(id as string, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ success: false, error: "Invalid post id" });
  }

  try {
    // Check ownership
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await prisma.post.delete({ where: { id: postId } });
    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete post" });
  }
}

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const postId = parseInt(id as string, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ success: false, error: "Invalid post id" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        category: true,
        tags: true,
      },
    });

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch post" });
  }
}

async function handlePUT(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const postId = parseInt(id as string, 10);

  const parsed = updatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues });
  }

  const { title, content, category, tags, published } = parsed.data;

  try {
    // Check ownership
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
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
      ...(typeof published === "boolean" && { published }),
      ...(tagsData && { tags: tagsData }),
    };

    if (categoryConnect) {
      data.category = categoryConnect;
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
      include: { category: true, tags: true },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to update post" });
  }
}

// Default export function that handles all HTTP methods
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
