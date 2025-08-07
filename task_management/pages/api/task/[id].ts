import { NextApiRequest, NextApiResponse } from "next";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth.middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().optional(),
  priority: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

async function DELETE(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const taskId = parseInt(id as string, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid Task id" });
  }
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await prisma.task.delete({ where: { id: taskId } });
    return res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete Task" });
  }
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const taskId = parseInt(id as string, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid Task id" });
  }
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      },
    });
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch Task" });
  }
}

async function PUT(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const taskId = parseInt(id as string, 10);
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues });
  }
  const { title, description, completed, dueDate, priority, category, tags } = parsed.data;
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
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
        set: [],
        connectOrCreate: tags.map((tag: string) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      };
    }
    const data: any = {
      ...(title && { title }),
      ...(description && { description }),
      ...(typeof completed === "boolean" && { completed }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(priority && { priority }),
      ...(tagsData && { tags: tagsData }),
    };
    if (categoryConnect) {
      data.category = categoryConnect;
    }
    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      include: { category: true, tags: true },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update Task" });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return authMiddleware(GET)(req as AuthenticatedRequest, res);
  }
  
  if (req.method === 'PUT') {
    return authMiddleware(PUT)(req as AuthenticatedRequest, res);
  }
  
  if (req.method === 'DELETE') {
    return authMiddleware(DELETE)(req as AuthenticatedRequest, res);
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
