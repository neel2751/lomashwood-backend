import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { PageServiceImpl } from './page.service';
import {
  createPageSchema,
  updatePageSchema,
  pageListQuerySchema,
  pageIdParamSchema,
  pageSlugParamSchema,
  systemSlugParamSchema,
} from './page.schemas';
import {
  CreatePagePayload,
  UpdatePagePayload,
  PageListQuery,
} from './page.types';
// ─── FIX: derive param types from schemas rather than importing non-existent
//          exports from page.types ───
type PageIdParam     = z.infer<typeof pageIdParamSchema>;
type PageSlugParam   = z.infer<typeof pageSlugParamSchema>;
type SystemSlugParam = z.infer<typeof systemSlugParamSchema>;

import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils';
import { validateBody, validateQuery, validateParams } from '../../shared/utils';
import { eventProducer } from '../../infrastructure/messaging/event-producer';

export class PageController {
  private readonly service: PageServiceImpl;

  constructor() {
    this.service = new PageServiceImpl(eventProducer);
  }

  listPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validateQuery(pageListQuerySchema, req.query) as PageListQuery;
      const result = await this.service.listPages(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getPublishedPages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pages = await this.service.getPublishedPages();
      sendSuccess(res, pages);
    } catch (error) {
      next(error);
    }
  };

  getSystemPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = validateParams(systemSlugParamSchema, req.params) as SystemSlugParam;
      const page = await this.service.getSystemPage(slug);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  getPageBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = validateParams(pageSlugParamSchema, req.params) as PageSlugParam;
      const page = await this.service.getPageBySlug(slug);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  getPageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(pageIdParamSchema, req.params) as PageIdParam;
      const page = await this.service.getPageById(id);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  createPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validateBody(createPageSchema, req.body) as CreatePagePayload;
      const page = await this.service.createPage(body);
      sendCreated(res, page);
    } catch (error) {
      next(error);
    }
  };

  updatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(pageIdParamSchema, req.params) as PageIdParam;
      const body = validateBody(updatePageSchema, req.body) as UpdatePagePayload;
      const page = await this.service.updatePage(id, body);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  deletePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(pageIdParamSchema, req.params) as PageIdParam;
      await this.service.deletePage(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}