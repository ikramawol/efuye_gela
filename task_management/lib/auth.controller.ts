import prisma from './prisma';

export async function createUser(email: string, name: string, password: string){
    try{
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password
            }
        })
        return {
            success: true,
            data: user
        }
    } catch (error){
        return {
            success: false, 
            error: 'Failed to create user',
            status: 500
        }
    }
}

export async function getUserById(id: number){
    try{
        const user = await prisma.user.findUnique({
            where: { id }
        })
        if (!user){
            return { error: 'User not found', status: 404 }
        }
        return { 
            success: true,
            data: user
        }
    } catch (error) {
        return {
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getAllUsers(){
    try{
        const users = await prisma.user.findMany();
        return {
            success: true,
            data: users
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function updateUser(id: number, data: { email?: string, name?: string }){
    try{
        const user = await prisma.user.update({
            where: { id },
            data
        })
        return {
            success: true,
            data: user
        }

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }

    }
}

export async function deleteUser(id: number) {
  try {
    const user = await prisma.user.delete({
      where: { id },
    })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getUserByEmail(email: string){
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user){
            return { success: false, error: 'User not found', status: 404 }
        }
        return { success: true, data: user }
    } catch (error) {
        return {
            success : false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500
        }
    }
}
// export const 