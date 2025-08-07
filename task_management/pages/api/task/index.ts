import { NextApiRequest, NextApiResponse } from "next";
import { getAllTasks } from "@/lib/task.controller";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth.middleware";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().optional(),
  priority: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await getAllTasks();
    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
}

export async function handlePOST(req: AuthenticatedRequest, res: NextApiResponse) {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues });
  }
  const { title, description, completed, dueDate, priority, category, tags } = parsed.data;
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'User authentication required to create a task' });
  }
  try {
    let categoryId = undefined;
    if (category) {
      const cat = await prisma.category.upsert({
        where: { name: category },
        update: {},
        create: { name: category },
      });
      categoryId = cat.id;
    }
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
      description,
      completed: completed ?? false,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority ?? 1,
      userId: req.user.id,
      ...(tagsData && { tags: tagsData }),
    };
    if (categoryId) {
      data.categoryId = categoryId;
    }
    const task = await prisma.task.create({
      data,
      include: { category: true, tags: true },
    });
    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ success: false, error: 'Failed to create task. Please try again.' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return authMiddleware(handleGET)(req as AuthenticatedRequest, res);
  }
  if (req.method === 'POST') {
    return authMiddleware(handlePOST)(req as AuthenticatedRequest, res);
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
