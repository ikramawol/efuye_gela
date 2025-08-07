import prisma from "./prisma"

// CREATE
export async function createTask(
  title: string,
  description: string | null,
  userId: number,
  completed: boolean = false,
  dueDate?: Date | null,
  priority: number = 1,
  categoryId?: number | null,
  tagIds?: number[]
) {
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        dueDate,
        priority,
        userId,
        categoryId,
        tags: tagIds && tagIds.length > 0
          ? { connect: tagIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        category: true,
        tags: true,
      },
    });
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function getAllTasks(filters: { category?: string; completed?: boolean } = {}) {
  try {
    const where: any = {};
    if (filters.category) {
      where.category = { name: filters.category };
    }
    if (typeof filters.completed === 'boolean') {
      where.completed = filters.completed;
    }
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      }
    });
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function getTaskById(id: number) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      }
    });
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// UPDATE
export async function updateTask(
  id: number,
  data: {
    title?: string;
    description?: string | null;
    completed?: boolean;
    dueDate?: Date | null;
    priority?: number;
    categoryId?: number | null;
    tagIds?: number[];
  }
) {
  try {
    const { tagIds, ...rest } = data;
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        tags: tagIds
          ? { set: tagIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      }
    });
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// DELETE
export async function deleteTask(id: number) {
  try {
    const task = await prisma.task.delete({
      where: { id },
    });
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}