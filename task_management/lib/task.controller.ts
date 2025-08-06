import prisma from './prisma';

export async function createTask(email: string, name: string, password: string){
    try{
        const task = await prisma.task.create({
            data: {
                email,
                name,
                password
            }
        })
        return {
            success: true,
            data: task
        }
    } catch (error){
        return {
            success: false, 
            error: 'Failed to create task',
            status: 500
        }
    }
}

export async function getTaskById(id: number){
    try{
        const task = await prisma.task.findUnique({
            where: { id }
        })
        if (!task){
            return { error: 'task not found', status: 404 }
        }
        return { 
            success: true,
            data: task
        }
    } catch (error) {
        return {
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getAllTasks(){
    try{
        const tasks = await prisma.task.findMany();
        return {
            succes: true,
            data: tasks
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function updateTask(id: number, data: { email?: string, name?: string }){
    try{
        const task = await prisma.task.update({
            where: { id },
            data
        })
        return {
            success: true,
            data: task
        }

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }

    }
}

export async function deleteTask(id: number) {
  try {
    const task = await prisma.task.delete({
      where: { id },
    })
    return { success: true, data: task }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
// export const 