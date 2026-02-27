import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../infrastructure/db/prisma.client';
import { z } from 'zod';

const blogSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  content: z.string(),
  coverImage: z.string().url().optional(),
  author: z.string(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  readingTime: z.number().default(0),
});

export async function getBlogs(req: Request, res: Response) {
  try {
    const { status, categoryId, tag } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (tag) where.tags = { has: tag };

    const blogs = await prisma.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });

    const total = await prisma.blog.count({ where });

    res.json({
      data: blogs,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function getBlogById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Blog not found' });
    }

    res.json({ data: blog });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function createBlog(req: Request, res: Response) {
  try {
    const data = blogSchema.parse(req.body);
    const blog = await prisma.blog.create({
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      },
    });

    res.status(StatusCodes.CREATED).json({ data: blog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function updateBlog(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = blogSchema.partial().parse(req.body);

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      },
    });

    res.json({ data: blog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Blog not found' });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function deleteBlog(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.blog.findUnique({ where: { id } }); // Check exists

    await prisma.blog.delete({
      where: { id },
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Blog not found' });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}