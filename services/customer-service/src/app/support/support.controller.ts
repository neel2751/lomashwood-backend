import { Request, Response, NextFunction } from 'express';
import { SupportService } from './support.service';
import { CreateTicketSchema, UpdateTicketSchema, TicketQuerySchema, AddMessageSchema } from './support.schemas';
import { HttpStatus } from '../../shared/constants';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils';

export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const data = CreateTicketSchema.parse(req.body);
      const ticket = await this.supportService.createTicket(customerId, data);
      sendCreated(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  getMyTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const query = TicketQuerySchema.parse(req.query);
      const result = await this.supportService.getTicketsByCustomer(customerId, query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const { id } = req.params;
      const ticket = await this.supportService.getTicketById(id, customerId);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  updateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const { id } = req.params;
      const data = UpdateTicketSchema.parse(req.body);
      const ticket = await this.supportService.updateTicket(id, customerId, data);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  closeTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const { id } = req.params;
      const ticket = await this.supportService.closeTicket(id, customerId);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  addMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const { id } = req.params;
      const data = AddMessageSchema.parse(req.body);
      const message = await this.supportService.addMessage(id, customerId, data);
      sendCreated(res, message);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const { id } = req.params;
      const messages = await this.supportService.getMessages(id, customerId);
      sendSuccess(res, messages);
    } catch (error) {
      next(error);
    }
  };

  getAllTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = TicketQuerySchema.parse(req.query);
      const result = await this.supportService.getAllTickets(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  assignTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { agentId } = req.body;
      const ticket = await this.supportService.assignTicket(id, agentId);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ticket = await this.supportService.updateTicketStatus(id, status);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  deleteTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.supportService.deleteTicket(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}