import { WebhookRepository } from '../../app/webhooks/webhook.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { WebhookStatus } from '../../app/webhooks/webhook.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    webhook: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    webhookDeliveryLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const repo = new WebhookRepository();

describe('WebhookRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a webhook record', async () => {
      const input = { url: 'https://example.com/hook', event: 'booking.created', secret: 'sec' };
      const created = { id: 'wh-1', ...input, status: WebhookStatus.ACTIVE };
      (prisma.webhook.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.webhook.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns webhook when found', async () => {
      const webhook = { id: 'wh-1', url: 'https://example.com/hook' };
      (prisma.webhook.findUnique as jest.Mock).mockResolvedValue(webhook);

      const result = await repo.findById('wh-1');

      expect(prisma.webhook.findUnique).toHaveBeenCalledWith({ where: { id: 'wh-1' } });
      expect(result).toEqual(webhook);
    });

    it('returns null when not found', async () => {
      (prisma.webhook.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all webhooks', async () => {
      const webhooks = [{ id: 'wh-1' }, { id: 'wh-2' }];
      (prisma.webhook.findMany as jest.Mock).mockResolvedValue(webhooks);

      const result = await repo.findAll();

      expect(prisma.webhook.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findByEvent', () => {
    it('returns webhooks subscribed to an event', async () => {
      const webhooks = [{ id: 'wh-1', event: 'booking.created' }];
      (prisma.webhook.findMany as jest.Mock).mockResolvedValue(webhooks);

      const result = await repo.findByEvent('booking.created');

      expect(prisma.webhook.findMany).toHaveBeenCalledWith({
        where: { event: 'booking.created', status: WebhookStatus.ACTIVE },
      });
      expect(result).toEqual(webhooks);
    });
  });

  describe('updateStatus', () => {
    it('updates webhook status', async () => {
      const updated = { id: 'wh-1', status: WebhookStatus.INACTIVE };
      (prisma.webhook.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('wh-1', WebhookStatus.INACTIVE);

      expect(prisma.webhook.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: { status: WebhookStatus.INACTIVE },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('logDelivery', () => {
    it('creates a delivery log entry', async () => {
      const input = { webhookId: 'wh-1', payload: '{}', statusCode: 200, success: true };
      const log = { id: 'log-1', ...input };
      (prisma.webhookDeliveryLog.create as jest.Mock).mockResolvedValue(log);

      const result = await repo.logDelivery(input);

      expect(prisma.webhookDeliveryLog.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(log);
    });
  });

  describe('findDeliveryLogs', () => {
    it('returns delivery logs for a webhook', async () => {
      const logs = [{ id: 'log-1', webhookId: 'wh-1' }];
      (prisma.webhookDeliveryLog.findMany as jest.Mock).mockResolvedValue(logs);

      const result = await repo.findDeliveryLogs('wh-1');

      expect(prisma.webhookDeliveryLog.findMany).toHaveBeenCalledWith({
        where: { webhookId: 'wh-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(logs);
    });
  });

  describe('delete', () => {
    it('deletes webhook by id', async () => {
      (prisma.webhook.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('wh-1');

      expect(prisma.webhook.delete).toHaveBeenCalledWith({ where: { id: 'wh-1' } });
    });
  });
});