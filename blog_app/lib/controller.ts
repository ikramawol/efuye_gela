import prisma from './prisma'

// CREATE
export async function createUser(email: string, name: string, password: string) {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password,
      },
    })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getAllUsers(options?: {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  includePosts?: boolean
  includeComments?: boolean
}) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      includePosts = true,
      includeComments = false
    } = options || {}

    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    // Build include object
    const include: any = {}
    if (includePosts) include.posts = true
    if (includeComments) include.comments = true

    const users = await prisma.user.findMany({
      where,
      include,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    })

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    return { 
      success: true, 
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// READ - Get user by ID
export async function getUserById(id: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}


export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        posts: true,
      },
    })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// UPDATE
export async function updateUser(id: number, data: { email?: string; name?: string }) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// DELETE
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

//Post

// CREATE
export async function createPost(title: string, content: string, authorId: number, published: boolean = false) {
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
    })
    return { success: true, data: post }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getAllPosts(options?: {
  page?: number
  limit?: number
  published?: boolean
  search?: string
  sortBy?: 'id' | 'title' | 'authorId'
  sortOrder?: 'asc' | 'desc'
  includeAuthor?: boolean
  includeComments?: boolean
  category?: string
  tags?: string[]
}) {
  try {
    const {
      page = 1,
      limit = 10,
      published,
      search = '',
      sortBy,
      sortOrder = 'desc',
      includeAuthor = true,
      includeComments = true,
      category,
      tags
    } = options || {}

    const skip = (page - 1) * limit

    const where: any = {}
    if (published !== undefined) where.published = published
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (category) {
      where.category = { name: category }
    }
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          name: { in: tags }
        }
      }
    }
    const include: any = {}
    if (includeAuthor) {
      include.author = {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
    if (includeComments) {
      include.comments = {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }

    if (category) {
      include.category = true
    }
    if (tags) {
      include.tags = true
    }

    // Only allow valid fields for orderBy
    let validSortBy: 'id' | 'title' | 'authorId' = 'id';
    if (sortBy === 'title' || sortBy === 'authorId') {
      validSortBy = sortBy;
    }
    // If sortBy is 'createdAt' or undefined, default to 'id'
    const orderBy = { [validSortBy]: sortOrder };

    const posts = await prisma.post.findMany({
      where,
      include,
      ...(orderBy && { orderBy }),
      skip,
      take: limit,
    })

    //total count for pagination
    const total = await prisma.post.count({ where })

    return { 
      success: true, 
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getPostById(id: number, includeComments: boolean = true) {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: includeComments ? {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        } : false
      },
    })
    return { success: true, data: post }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// UPDATE
export async function updatePost(id: number, data: { title?: string; content?: string; published?: boolean }) {
  try {
    const post = await prisma.post.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
    })
    return { success: true, data: post }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// DELETE
export async function deletePost(id: number) {
  try {
    const post = await prisma.post.delete({
      where: { id },
    })
    return { success: true, data: post }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

//COMMENT

// CREATE
export async function createComment(content: string, authorId: number, postId: number) {
  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        postId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
    })
    return { success: true, data: comment }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getAllComments(options?: {
  page?: number
  limit?: number
  postId?: number
  authorId?: number
  sortBy?: 'createdAt' | 'content'
  sortOrder?: 'asc' | 'desc'
  includeAuthor?: boolean
  includePost?: boolean
}) {
  try {
    const {
      page = 1,
      limit = 10,
      postId,
      authorId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeAuthor = true,
      includePost = true
    } = options || {}

    const skip = (page - 1) * limit

    const where: any = {}
    if (postId) where.postId = postId
    if (authorId) where.authorId = authorId

    // Build include object
    const include: any = {}
    if (includeAuthor) {
      include.author = {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
    if (includePost) {
      include.post = {
        select: {
          id: true,
          title: true
        }
      }
    }

    const comments = await prisma.comment.findMany({
      where,
      include,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    })

    const total = await prisma.comment.count({ where })

    return { 
      success: true, 
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// READ - Get comment by ID
export async function getCommentById(id: number) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
    })
    return { success: true, data: comment }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// UPDATE
export async function updateComment(id: number, data: { content: string }) {
  try {
    const comment = await prisma.comment.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
    })
    return { success: true, data: comment }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// DELETE
export async function deleteComment(id: number) {
  try {
    const comment = await prisma.comment.delete({
      where: { id },
    })
    return { success: true, data: comment }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 