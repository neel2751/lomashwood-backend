import { Request, Response, NextFunction } from 'express';

import { BlogServiceImpl } from './blog.service';
import {
  createBlogSchema,
  updateBlogSchema,
  blogListQuerySchema,
  blogIdParamSchema,
  blogSlugParamSchema,
} from './blog.schemas';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils';
import { validateBody, validateQuery, validateParams } from '../../shared/utils';
import { CreateBlogPayload, UpdateBlogPayload, BlogListQuery } from './blog.types';
import { eventProducer } from '../../infrastructure/messaging/event-producer';

export class BlogController {
  private readonly service: BlogServiceImpl;

  constructor() {
    this.service = new BlogServiceImpl(eventProducer);
  }

  listBlogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validateQuery(blogListQuerySchema, req.query) as BlogListQuery;
      const result = await this.service.listBlogs(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getBlogBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = validateParams(blogSlugParamSchema, req.params) as { slug: string };
      const blog = await this.service.getBlogBySlug(slug);
      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  };

  getBlogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(blogIdParamSchema, req.params) as { id: string };
      const blog = await this.service.getBlogById(id);
      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  };

  getFeaturedBlogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;
      const blogs = await this.service.getFeaturedBlogs(limit);
      sendSuccess(res, blogs);
    } catch (error) {
      next(error);
    }
  };

  createBlog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validateBody(createBlogSchema, req.body) as Omit<CreateBlogPayload, 'authorId'>;
      const authorId = (req as Request & { user?: { id: string } }).user?.id ?? 'system';
      const payload: CreateBlogPayload = { ...body, authorId };
      const blog = await this.service.createBlog(payload);
      sendCreated(res, blog);
    } catch (error) {
      next(error);
    }
  };

  updateBlog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(blogIdParamSchema, req.params) as { id: string };
      const body = validateBody(updateBlogSchema, req.body) as UpdateBlogPayload;
      const blog = await this.service.updateBlog(id, body);
      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  };

  deleteBlog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(blogIdParamSchema, req.params) as { id: string };
      await this.service.deleteBlog(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}