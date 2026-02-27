import { WebhookService } from '../../app/webhooks/webhook.service';
import { WebhookRepository } from '../../app/webhooks/webhook.repository';
import { WebhookStatus } from '../../app/webhooks/webhook.types';

jest.mock('../../app/webhooks/webhook.repository');

const mockRepo = new WebhookRepository() as jest.Mocked<WebhookRepository>;
const service = new WebhookService(mockRepo);

describe('WebhookService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a webhook record', async () => {
      const input = { url: 'https://example.com/hook', event: 'booking.created', secret: 'sec' };
      const created = { id: 'wh-1', ...input, status: WebhookStatus.ACTIVE };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns webhook when found', async () => {
      const webhook = { id: 'wh-1', url: 'https://example.com/hook' };
      mockRepo.findById.mockResolvedValue(webhook);

      const result = await service.findById('wh-1');

      expect(result).toEqual(webhook);
    });

    it('returns null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all webhooks', async () => {
      const webhooks = [{ id: 'wh-1' }, { id: 'wh-2' }];
      mockRepo.findAll.mockResolvedValue(webhooks);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('dispatch', () => {
    it('dispatches webhook payload to registered url', async () => {
      const webhook = { id: 'wh-1', url: 'https://example.com/hook', secret: 'sec', status: WebhookStatus.ACTIVE };
      mockRepo.findByEvent.mockResolvedValue([webhook]);
      mockRepo.logDelivery.mockResolvedValue({ id: 'log-1' });

      await service.dispatch('booking.created', { bookingId: 'b-1' });

      expect(mockRepo.findByEvent).toHaveBeenCalledWith('booking.created');
      expect(mockRepo.logDelivery).toHaveBeenCalled();
    });

    it('skips inactive webhooks during dispatch', async () => {
      const webhook = { id: 'wh-1', url: 'https://example.com/hook', secret: 'sec', status: WebhookStatus.INACTIVE };
      mockRepo.findByEvent.mockResolvedValue([webhook]);

      await service.dispatch('booking.created', { bookingId: 'b-1' });

      expect(mockRepo.logDelivery).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('updates webhook status', async () => {
      const updated = { id: 'wh-1', status: WebhookStatus.INACTIVE };
      mockRepo.updateStatus.mockResolvedValue(updated);

      const result = await service.updateStatus('wh-1', WebhookStatus.INACTIVE);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('wh-1', WebhookStatus.INACTIVE);
      expect(result.status).toBe(WebhookStatus.INACTIVE);
    });
  });

  describe('delete', () => {
    it('deletes a webhook', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('wh-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('wh-1');
    });
  });
});