import { CampaignService } from '../../app/campaigns/campaign.service';
import { CampaignRepository } from '../../app/campaigns/campaign.repository';
import { CampaignStatus, CampaignChannel } from '../../app/campaigns/campaign.types';

jest.mock('../../app/campaigns/campaign.repository');

const mockRepo = new CampaignRepository() as jest.Mocked<CampaignRepository>;
const service = new CampaignService(mockRepo);

describe('CampaignService', () => {
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
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result.status).toBe(CampaignStatus.DRAFT);
    });
  });

  describe('findById', () => {
    it('returns campaign when found', async () => {
      const campaign = { id: 'camp-1', name: 'Summer Sale 2026' };
      mockRepo.findById.mockResolvedValue(campaign);

      const result = await service.findById('camp-1');

      expect(result).toEqual(campaign);
    });

    it('returns null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all campaigns', async () => {
      const campaigns = [{ id: 'camp-1' }, { id: 'camp-2' }];
      mockRepo.findAll.mockResolvedValue(campaigns);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('launch', () => {
    it('transitions campaign from draft to active', async () => {
      const campaign = { id: 'camp-1', status: CampaignStatus.DRAFT };
      mockRepo.findById.mockResolvedValue(campaign);
      const launched = { ...campaign, status: CampaignStatus.ACTIVE };
      mockRepo.updateStatus.mockResolvedValue(launched);

      const result = await service.launch('camp-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('camp-1', CampaignStatus.ACTIVE);
      expect(result.status).toBe(CampaignStatus.ACTIVE);
    });

    it('throws when campaign is already active', async () => {
      const campaign = { id: 'camp-1', status: CampaignStatus.ACTIVE };
      mockRepo.findById.mockResolvedValue(campaign);

      await expect(service.launch('camp-1')).rejects.toThrow();
    });

    it('throws when campaign not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.launch('missing')).rejects.toThrow();
    });
  });

  describe('pause', () => {
    it('transitions campaign from active to paused', async () => {
      const campaign = { id: 'camp-1', status: CampaignStatus.ACTIVE };
      mockRepo.findById.mockResolvedValue(campaign);
      const paused = { ...campaign, status: CampaignStatus.PAUSED };
      mockRepo.updateStatus.mockResolvedValue(paused);

      const result = await service.pause('camp-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('camp-1', CampaignStatus.PAUSED);
      expect(result.status).toBe(CampaignStatus.PAUSED);
    });
  });

  describe('cancel', () => {
    it('transitions campaign to cancelled', async () => {
      const campaign = { id: 'camp-1', status: CampaignStatus.ACTIVE };
      mockRepo.findById.mockResolvedValue(campaign);
      const cancelled = { ...campaign, status: CampaignStatus.CANCELLED };
      mockRepo.updateStatus.mockResolvedValue(cancelled);

      const result = await service.cancel('camp-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('camp-1', CampaignStatus.CANCELLED);
      expect(result.status).toBe(CampaignStatus.CANCELLED);
    });
  });

  describe('delete', () => {
    it('deletes a draft campaign', async () => {
      const campaign = { id: 'camp-1', status: CampaignStatus.DRAFT };
      mockRepo.findById.mockResolvedValue(campaign);
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('camp-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('camp-1');
    });

    it('throws when trying to delete an active campaign', async () => {
      const campaign = { id: 'camp-1', status: CampaignStatus.ACTIVE };
      mockRepo.findById.mockResolvedValue(campaign);

      await expect(service.delete('camp-1')).rejects.toThrow();
    });
  });
});