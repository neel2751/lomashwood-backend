import { Router } from 'express';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { authenticate } from '../../infrastructure/http/middleware/auth.middleware';
import { requireAdmin } from '../../infrastructure/http/middleware/role.middleware';
import { validateRequest } from '../../infrastructure/http/middleware/validate.middleware';
import { CreateTicketSchema, UpdateTicketSchema, TicketQuerySchema, AddMessageSchema } from './support.schemas';

const router = Router();

const supportRepository = new SupportRepository(prisma);
const supportService = new SupportService(supportRepository);
const supportController = new SupportController(supportService);

router.use(authenticate);

router.post(
  '/',
  validateRequest({ body: CreateTicketSchema }),
  supportController.createTicket
);

router.get(
  '/my',
  validateRequest({ query: TicketQuerySchema }),
  supportController.getMyTickets
);

router.get(
  '/my/:id',
  supportController.getTicketById
);

router.patch(
  '/my/:id',
  validateRequest({ body: UpdateTicketSchema }),
  supportController.updateTicket
);

router.patch(
  '/my/:id/close',
  supportController.closeTicket
);

router.post(
  '/my/:id/messages',
  validateRequest({ body: AddMessageSchema }),
  supportController.addMessage
);

router.get(
  '/my/:id/messages',
  supportController.getMessages
);

router.get(
  '/admin',
  requireAdmin,
  validateRequest({ query: TicketQuerySchema }),
  supportController.getAllTickets
);

router.patch(
  '/admin/:id/assign',
  requireAdmin,
  supportController.assignTicket
);

router.patch(
  '/admin/:id/status',
  requireAdmin,
  supportController.updateTicketStatus
);

router.delete(
  '/admin/:id',
  requireAdmin,
  supportController.deleteTicket
);

export { router as supportRoutes };