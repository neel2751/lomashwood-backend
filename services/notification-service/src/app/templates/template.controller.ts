import { Request, Response, NextFunction } from 'express';
import { TemplateService } from './template.service';
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  RenderTemplateSchema,
  TemplateFilterSchema,
} from './template.schemas';
import { sendSuccess, sendCreated } from '../../shared/utils';

type AuthRequest = Request & { user?: { id: string } };

export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateTemplateSchema.parse(req.body);
      const template = await this.templateService.create(dto, req.user!.id);
      sendCreated(res, template, 'Template created');
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = UpdateTemplateSchema.parse(req.body);
      const template = await this.templateService.update(id, dto, req.user!.id);
      sendSuccess(res, template, 'Template updated');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.templateService.getById(id);
      sendSuccess(res, template);
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const { channel } = req.query as { channel: string };
      const template = await this.templateService.getBySlug(slug, channel);
      sendSuccess(res, template);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = TemplateFilterSchema.parse(req.query);
      const result = await this.templateService.list(filter);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  archive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.templateService.archive(id, req.user!.id);
      sendSuccess(res, template, 'Template archived');
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.templateService.restore(id, req.user!.id);
      sendSuccess(res, template, 'Template restored');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.templateService.delete(id);
      sendSuccess(res, null, 'Template deleted');
    } catch (err) {
      next(err);
    }
  };

  render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RenderTemplateSchema.parse(req.body);
      const rendered = await this.templateService.render(dto);
      sendSuccess(res, rendered, 'Template rendered');
    } catch (err) {
      next(err);
    }
  };

  listVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const versions = await this.templateService.listVersions(id);
      sendSuccess(res, versions);
    } catch (err) {
      next(err);
    }
  };

  getVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const version = parseInt(req.params.version, 10);
      const record = await this.templateService.getVersion(id, version);
      sendSuccess(res, record);
    } catch (err) {
      next(err);
    }
  };
}