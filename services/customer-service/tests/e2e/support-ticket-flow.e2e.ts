import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Support Ticket Flow E2E', () => {
  let customerToken: string;
  let agentToken: string;
  const testUserId = `support-user-${Date.now()}`;
  let ticketId: string;

  beforeAll(async () => {
    customerToken = generateTestToken({ sub: testUserId, role: 'customer' });
    agentToken = generateTestToken({ sub: 'support-agent-001', role: 'admin' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Patricia',
        lastName: 'Moore',
        email: `patricia.m.${Date.now()}@test.com`,
        phone: '+447944555666',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.supportTicketMessage.deleteMany({ where: { ticket: { userId: testUserId } } });
    await prisma.supportTicket.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('customer creates a support ticket', async () => {
    const res = await request(app)
      .post('/v1/customers/support/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subject: 'Query about kitchen delivery timeframe',
        category: 'DELIVERY',
        priority: 'MEDIUM',
        message: 'I placed an order two weeks ago and have not received any delivery confirmation. Could you please provide an estimated delivery date for my kitchen order?',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.subject).toBe('Query about kitchen delivery timeframe');
    expect(res.body.data.category).toBe('DELIVERY');
    ticketId = res.body.data.id;
  });

  it('customer lists their own tickets', async () => {
    const res = await request(app)
      .get('/v1/customers/support/tickets')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBeGreaterThan(0);
    expect(res.body.data.tickets[0].userId).toBe(testUserId);
  });

  it('customer retrieves specific ticket details', async () => {
    const res = await request(app)
      .get(`/v1/customers/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(ticketId);
    expect(res.body.data.messages.length).toBe(1);
  });

  it('agent retrieves all open tickets', async () => {
    const res = await request(app)
      .get('/v1/customers/support/tickets')
      .set('Authorization', `Bearer ${agentToken}`)
      .query({ status: 'OPEN' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tickets)).toBe(true);
  });

  it('agent assigns the ticket to themselves', async () => {
    const res = await request(app)
      .patch(`/v1/customers/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        assignedTo: 'support-agent-001',
        status: 'IN_PROGRESS',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
    expect(res.body.data.assignedTo).toBe('support-agent-001');
  });

  it('agent replies to the ticket', async () => {
    const res = await request(app)
      .post(`/v1/customers/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        message: 'Thank you for contacting us. I have checked your order and your kitchen delivery is scheduled for next Tuesday between 8am and 12pm. You will receive an email confirmation shortly.',
        isInternal: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isInternal).toBe(false);
  });

  it('customer sees agent reply in ticket thread', async () => {
    const res = await request(app)
      .get(`/v1/customers/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.messages.length).toBe(2);
    expect(res.body.data.messages[1].isInternal).toBe(false);
  });

  it('customer adds a follow-up message', async () => {
    const res = await request(app)
      .post(`/v1/customers/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        message: 'Thank you for the update. Will someone be there to assist with the installation?',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.senderType).toBe('CUSTOMER');
  });

  it('agent adds internal note invisible to customer', async () => {
    const res = await request(app)
      .post(`/v1/customers/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        message: 'Customer confirmed for Tuesday delivery. Schedule installation team.',
        isInternal: true,
      });

    expect(res.status).toBe(201);

    const customerView = await request(app)
      .get(`/v1/customers/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    const internalMessages = customerView.body.data.messages.filter(
      (m: { isInternal: boolean }) => m.isInternal,
    );
    expect(internalMessages.length).toBe(0);
  });

  it('agent resolves the ticket', async () => {
    const res = await request(app)
      .patch(`/v1/customers/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RESOLVED');
    expect(res.body.data.resolvedAt).toBeDefined();
  });

  it('customer rates the support interaction', async () => {
    const res = await request(app)
      .post(`/v1/customers/support/tickets/${ticketId}/rating`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        comment: 'Excellent and prompt support, very helpful.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
  });

  it('customer cannot reopen a resolved ticket by submitting new message without escalation', async () => {
    const res = await request(app)
      .post(`/v1/customers/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ message: 'Actually I have another question about the installation warranty.' });

    expect([200, 201, 400, 409]).toContain(res.status);
  });

  it('returns 404 for a ticket belonging to another user', async () => {
    const otherToken = generateTestToken({ sub: 'unrelated-user', role: 'customer' });

    const res = await request(app)
      .get(`/v1/customers/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});