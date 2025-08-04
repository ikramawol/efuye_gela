import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Clean up existing data
  console.log('Cleaning up existing data...')
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
  
  const hashedPassword1 = await bcrypt.hash('password123', 10)
  const hashedPassword2 = await bcrypt.hash('password123', 10)
  const hashedPassword3 = await bcrypt.hash('password123', 10)

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      password: hashedPassword1,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      password: hashedPassword2,
    },
  })

  const post1 = await prisma.post.create({
    data: {
      title: 'My First Post',
      content: 'This is my first blog post. Welcome to my blog!',
      published: true,
      authorId: user1.id,
    },
  })

  const post2 = await prisma.post.create({
    data: {
      title: 'Getting Started with Next.js',
      content: 'Next.js is a great framework for building React applications...',
      published: true,
      authorId: user1.id,
    },
  })

  const post3 = await prisma.post.create({
    data: {
      title: 'Database Design Best Practices',
      content: 'When designing a database schema, consider these important factors...',
      published: false,
      authorId: user2.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Great post! Very informative.',
      authorId: user1.id,
      postId: post1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Thanks for sharing this knowledge!',
      authorId: user2.id,
      postId: post1.id, 
    },
  })

  await prisma.comment.create({
    data: {
      content: 'This helped me a lot with my project.',
      authorId: user1.id,
      postId: post2.id,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      password: hashedPassword3,
    },
  })

  const post4 = await prisma.post.create({
    data: {
      title: 'Advanced Prisma Queries',
      content: 'Learn how to use filtering, pagination, and sorting in Prisma...',
      published: true,
      authorId: user3.id,
    },
  })

  const post5 = await prisma.post.create({
    data: {
      title: 'Authentication with Next.js',
      content: 'Implementing JWT authentication in Next.js applications...',
      published: true,
      authorId: user2.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Excellent tutorial! Very well explained.',
      authorId: user2.id,
      postId: post3.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'I learned a lot from this post.',
      authorId: user3.id,
      postId: post1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Can you write more about this topic?',
      authorId: user1.id,
      postId: post4.id,
    },
  })

  console.log('Database seeded successfully!')
  console.log('Created users:', { 
    user1: user1.name, 
    user2: user2.name, 
    user3: user3.name 
  })
  console.log('Created 5 posts and 6 comments')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
