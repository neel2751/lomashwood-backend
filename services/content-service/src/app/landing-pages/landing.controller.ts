import { Request, Response, NextFunction } from 'express';

import { LandingServiceImpl } from './landing.service';
import {
  createLandingSchema,
  updateLandingSchema,
  landingListQuerySchema,
  landingIdParamSchema,
  landingSlugParamSchema,
} from './landing.schemas';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils';
import { validateBody, validateQuery, validateParams } from '../../shared/utils';
import { eventProducer } from '../../infrastructure/messaging/event-producer';
import {
  LandingListQuery,
  CreateLandingPagePayload,
  UpdateLandingPagePayload,
} from './landing.types';

export class LandingController {
  private readonly service: LandingServiceImpl;

  constructor() {
    this.service = new LandingServiceImpl(eventProducer);
  }

  listLandingPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validateQuery(landingListQuerySchema, req.query) as unknown as LandingListQuery;
      const result = await this.service.listLandingPages(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getActiveLandingPages = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const pages = await this.service.getActiveLandingPages();
      sendSuccess(res, pages);
    } catch (error) {
      next(error);
    }
  };

  getLandingBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = validateParams(landingSlugParamSchema, req.params);
      const page = await this.service.getLandingBySlug(slug);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  getLandingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(landingIdParamSchema, req.params);
      const page = await this.service.getLandingById(id);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  createLandingPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validateBody(createLandingSchema, req.body) as unknown as CreateLandingPagePayload;
      const page = await this.service.createLandingPage(body);
      sendCreated(res, page);
    } catch (error) {
      next(error);
    }
  };

  updateLandingPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(landingIdParamSchema, req.params);
      const body = validateBody(updateLandingSchema, req.body) as unknown as UpdateLandingPagePayload;
      const page = await this.service.updateLandingPage(id, body);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  deleteLandingPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(landingIdParamSchema, req.params);
      await this.service.deleteLandingPage(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}