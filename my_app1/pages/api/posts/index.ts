import { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "@/lib/controller";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth-middleware";

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

export async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const {
    page = "1",
    limit = "10",
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    category,
    tags,
  } = req.query;

  let tagsArray: string[] | undefined = undefined;
  if (typeof tags === "string") {
    tagsArray = tags.split(",");
  } else if (Array.isArray(tags)) {
    tagsArray = tags;
  }

  let sortByValue = sortBy;
  if (sortByValue === "createdAt" || !sortByValue) sortByValue = "id";
  const result = await getAllPosts({
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    search: search as string,
    sortBy: sortByValue as "title" | "id" | "authorId",
    sortOrder: sortOrder as "asc" | "desc",
    includeAuthor: true,
    includeComments: true,
    category: category as string | undefined,
    tags: tagsArray,
  });

  if (result.success) {
    return res
      .status(200)
      .json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
}

export async function handlePOST(req: AuthenticatedRequest, res: NextApiResponse) {
  // Validate input
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues });
  }

  const { title, content, category, tags, published } = parsed.data;
  
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: 'User authentication required to create a post' 
    });
  }

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
      authorId: req.user.id,
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
    console.error("Create post error:", error);
    
    // Provide clearer error messages
    if (error instanceof Error) {
      if (error.message.includes('authorId')) {
        return res.status(400).json({
          success: false,
          error: 'User authentication failed. Please login again.'
        });
      }
      if (error.message.includes('categoryId')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category provided.'
        });
      }
      if (error.message.includes('tags')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tags provided.'
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create post. Please try again.'
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGET(req, res);
  }
  
  if (req.method === 'POST') {
    return authMiddleware(handlePOST)(req as AuthenticatedRequest, res);
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
