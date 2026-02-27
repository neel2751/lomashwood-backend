import { CampaignRepository } from '../../app/campaigns/campaign.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { CampaignStatus, CampaignChannel } from '../../app/campaigns/campaign.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    campaign: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const repo = new CampaignRepository();

describe('CampaignRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a campaign record', async () => {
      const input = {
        name: 'Summer Sale 2026',
        channel: CampaignChannel.EMAIL,
        templateId: 'tpl-1',
        scheduledAt: new Date('2026-07-01T09:00:00Z'),
      };
      const created = { id: 'camp-1', ...input, status: CampaignStatus.DRAFT };
      (prisma.campaign.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.campaign.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns campaign when found', async () => {
      const campaign = { id: 'camp-1', name: 'Summer Sale 2026' };
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue(campaign);

      const result = await repo.findById('camp-1');

      expect(prisma.campaign.findUnique).toHaveBeenCalledWith({ where: { id: 'camp-1' } });
      expect(result).toEqual(campaign);
    });

    it('returns null when not found', async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all campaigns ordered by createdAt desc', async () => {
      const campaigns = [{ id: 'camp-1' }, { id: 'camp-2' }];
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue(campaigns);

      const result = await repo.findAll();

      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByStatus', () => {
    it('returns campaigns matching status', async () => {
      const campaigns = [{ id: 'camp-1', status: CampaignStatus.ACTIVE }];
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue(campaigns);

      const result = await repo.findByStatus(CampaignStatus.ACTIVE);

      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: { status: CampaignStatus.ACTIVE },
      });
      expect(result).toEqual(campaigns);
    });
  });

  describe('findScheduledBefore', () => {
    it('returns campaigns scheduled before a given date', async () => {
      const now = new Date();
      const campaigns = [{ id: 'camp-1', scheduledAt: new Date('2026-01-01') }];
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue(campaigns);

      const result = await repo.findScheduledBefore(now);

      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: {
          scheduledAt: { lte: now },
          status: CampaignStatus.ACTIVE,
        },
      });
      expect(result).toEqual(campaigns);
    });
  });

  describe('updateStatus', () => {
    it('updates campaign status', async () => {
      const updated = { id: 'camp-1', status: CampaignStatus.PAUSED };
      (prisma.campaign.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateStatus('camp-1', CampaignStatus.PAUSED);

      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { status: CampaignStatus.PAUSED },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('countByStatus', () => {
    it('returns count of campaigns by status', async () => {
      (prisma.campaign.count as jest.Mock).mockResolvedValue(4);

      const count = await repo.countByStatus(CampaignStatus.ACTIVE);

      expect(prisma.campaign.count).toHaveBeenCalledWith({
        where: { status: CampaignStatus.ACTIVE },
      });
      expect(count).toBe(4);
    });
  });

  describe('delete', () => {
    it('deletes campaign by id', async () => {
      (prisma.campaign.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('camp-1');

      expect(prisma.campaign.delete).toHaveBeenCalledWith({ where: { id: 'camp-1' } });
    });
  });
});