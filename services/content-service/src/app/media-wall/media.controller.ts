import { Request, Response, NextFunction } from 'express';

import { MediaWallServiceImpl } from './media.service';
import {
  createMediaSchema,
  updateMediaSchema,
  reorderMediaSchema,
  mediaListQuerySchema,
  mediaIdParamSchema,
} from './media.schemas';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils';
import { validateBody, validateQuery, validateParams } from '../../shared/utils';

export class MediaController {
  private readonly service: MediaWallServiceImpl;

  constructor() {
    this.service = new MediaWallServiceImpl();
  }

  listMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validateQuery(mediaListQuerySchema, req.query);
      const result = await this.service.listMedia(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getActiveMedia = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const media = await this.service.getActiveMedia();
      sendSuccess(res, media);
    } catch (error) {
      next(error);
    }
  };

  getMediaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(mediaIdParamSchema, req.params);
      const media = await this.service.getMediaById(id);
      sendSuccess(res, media);
    } catch (error) {
      next(error);
    }
  };

  createMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validateBody(createMediaSchema, req.body);
      const media = await this.service.createMedia(body);
      sendCreated(res, media);
    } catch (error) {
      next(error);
    }
  };

  updateMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(mediaIdParamSchema, req.params);
      const body = validateBody(updateMediaSchema, req.body);
      const media = await this.service.updateMedia(id, body);
      sendSuccess(res, media);
    } catch (error) {
      next(error);
    }
  };

  reorderMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validateBody(reorderMediaSchema, req.body);
      await this.service.reorderMedia(body);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };

  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = validateParams(mediaIdParamSchema, req.params);
      await this.service.deleteMedia(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}