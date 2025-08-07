import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth.middleware";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  const userId = parseInt(id as string, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, error: "Invalid user id" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: true,
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch user" });
  }
}

export async function handlePUT(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(id as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ success: false, error: "Invalid user id" });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required" 
    });
  }

  if (req.user.id !== userId) {
    return res.status(403).json({ 
      success: false, 
      error: "You can only update your own profile" 
    });
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid input data",
      details: parsed.error.issues 
    });
  }

  const { name, email, password } = parsed.data;

  try {
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ success: false, error: "Email is already taken by another user" });
      }
    }
    let updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password; // hash if needed
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        tasks: true,
      },
    });
    return res.status(200).json({ success: true, data: updatedUser, message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update user" 
    });
  }
}

export async function handleDELETE(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(id as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ success: false, error: "Invalid user id" });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required" 
    });
  }

  if (req.user.id !== userId) {
    return res.status(403).json({ 
      success: false, 
      error: "You can only delete your own account" 
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({ 
      success: true, 
      message: "User account deleted successfully" 
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete user account" 
    });
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
