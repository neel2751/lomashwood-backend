import {
  SupportTicket,
  SupportMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  MessageSender,
} from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const supportTicketFixtures = {
  open: {
    id: FIXED_IDS.ticket1,
    customerId: FIXED_IDS.customer1,
    agentId: null,
    ticketRef: 'TKT-ABCD1234',
    subject: 'Missing item from my order',
    category: TicketCategory.ORDER,
    priority: TicketPriority.HIGH,
    status: TicketStatus.OPEN,
    orderId: FIXED_IDS.order1,
    metadata: null,
    resolvedAt: null,
    deletedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies SupportTicket,

  inProgress: {
    id: FIXED_IDS.ticket2,
    customerId: FIXED_IDS.customer1,
    agentId: FIXED_IDS.agentUserId,
    ticketRef: 'TKT-EFGH5678',
    subject: 'Delivery date query',
    category: TicketCategory.DELIVERY,
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    orderId: null,
    metadata: { attemptedDeliveries: 2 },
    resolvedAt: null,
    deletedAt: null,
    createdAt: dateAgo(3),
    updatedAt: dateAgo(1),
  } satisfies SupportTicket,

  resolved: {
    id: 'tkt-00000000-0000-0000-0000-000000000003',
    customerId: FIXED_IDS.customer2,
    agentId: FIXED_IDS.agentUserId,
    ticketRef: 'TKT-IJKL9012',
    subject: 'Refund request for damaged product',
    category: TicketCategory.REFUND,
    priority: TicketPriority.URGENT,
    status: TicketStatus.RESOLVED,
    orderId: FIXED_IDS.order1,
    metadata: null,
    resolvedAt: dateAgo(2),
    deletedAt: null,
    createdAt: dateAgo(7),
    updatedAt: dateAgo(2),
  } satisfies SupportTicket,

  closed: {
    id: 'tkt-00000000-0000-0000-0000-000000000004',
    customerId: FIXED_IDS.customer1,
    agentId: null,
    ticketRef: 'TKT-MNOP3456',
    subject: 'General product enquiry',
    category: TicketCategory.GENERAL,
    priority: TicketPriority.LOW,
    status: TicketStatus.CLOSED,
    orderId: null,
    metadata: null,
    resolvedAt: dateAgo(14),
    deletedAt: null,
    createdAt: dateAgo(20),
    updatedAt: dateAgo(14),
  } satisfies SupportTicket,
};

export const supportMessageFixtures = {
  customerOpener: {
    id: FIXED_IDS.message1,
    ticketId: FIXED_IDS.ticket1,
    sender: MessageSender.CUSTOMER,
    senderId: FIXED_IDS.customer1,
    body: 'I ordered a kitchen worktop last week but received the wrong colour. Order number is ORD-12345.',
    attachments: ['https://cdn.example.com/attachments/receipt.pdf'],
    isInternal: false,
    createdAt: FIXED_DATE,
  } satisfies SupportMessage,

  agentReply: {
    id: 'msg-00000000-0000-0000-0000-000000000002',
    ticketId: FIXED_IDS.ticket1,
    sender: MessageSender.AGENT,
    senderId: FIXED_IDS.agentUserId,
    body: 'Thank you for getting in touch. I can see the order and will arrange a replacement worktop in the correct colour. I will follow up within 24 hours.',
    attachments: [],
    isInternal: false,
    createdAt: dateAgo(0),
  } satisfies SupportMessage,

  internalNote: {
    id: 'msg-00000000-0000-0000-0000-000000000003',
    ticketId: FIXED_IDS.ticket1,
    sender: MessageSender.AGENT,
    senderId: FIXED_IDS.agentUserId,
    body: 'Confirmed with warehouse: item was mispicked. Replacement dispatched.',
    attachments: [],
    isInternal: true,
    createdAt: dateAgo(0),
  } satisfies SupportMessage,

  systemMessage: {
    id: 'msg-00000000-0000-0000-0000-000000000004',
    ticketId: FIXED_IDS.ticket1,
    sender: MessageSender.SYSTEM,
    senderId: 'system',
    body: 'This ticket has been assigned to an agent and will be reviewed shortly.',
    attachments: [],
    isInternal: false,
    createdAt: dateAgo(0),
  } satisfies SupportMessage,
};

export const createTicketDto = {
  subject: 'Problem with my delivery',
  category: 'DELIVERY' as const,
  priority: 'MEDIUM' as const,
  body: 'My delivery was supposed to arrive today but has not shown up. Can you help?',
  orderId: FIXED_IDS.order1,
};

export const addMessageDto = {
  body: 'Just following up on my previous message. Any update?',
  attachments: [],
};

export const assignTicketDto = {
  agentId: FIXED_IDS.agentUserId,
};

export const updateTicketStatusDto = {
  status: 'IN_PROGRESS' as const,
};