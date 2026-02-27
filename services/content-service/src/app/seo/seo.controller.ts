import { Request, Response, NextFunction } from 'express';

import { SeoServiceImpl } from './seo.service';
import {
  upsertSeoSchema,
  updateSeoSchema,
  seoListQuerySchema,
  seoIdParamSchema,
  seoEntityParamSchema,
} from './seo.schemas';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils';
import { validateBody, validateQuery, validateParams } from '../../shared/utils';
import { SeoEntityType } from './seo.constants';

export class SeoController {
  private readonly service: SeoServiceImpl;

  constructor() {
    this.service = new SeoServiceImpl();
  }

  listSeoMeta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validateQuery(seoListQuerySchema, req.query);
      const result = await this.service.listSeoMeta(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getSeoById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(seoIdParamSchema, req.params);
      const meta = await this.service.getSeoById(id);
      sendSuccess(res, meta);
    } catch (error) {
      next(error);
    }
  };

  getSeoByEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entityType, entityId } = validateParams(seoEntityParamSchema, req.params);
      const meta = await this.service.getSeoByEntity(entityType as SeoEntityType, entityId);
      sendSuccess(res, meta);
    } catch (error) {
      next(error);
    }
  };

  upsertSeo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validateBody(upsertSeoSchema, req.body);
      const existing = await this.service
        .getSeoByEntity(body.entityType, body.entityId)
        .catch(() => null);

      const meta = await this.service.upsertSeo(body);

      if (existing) {
        sendSuccess(res, meta);
      } else {
        sendCreated(res, meta);
      }
    } catch (error) {
      next(error);
    }
  };

  updateSeo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(seoIdParamSchema, req.params);
      const body = validateBody(updateSeoSchema, req.body);
      const meta = await this.service.updateSeo(id, body);
      sendSuccess(res, meta);
    } catch (error) {
      next(error);
    }
  };

  deleteSeo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(seoIdParamSchema, req.params);
      await this.service.deleteSeo(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}