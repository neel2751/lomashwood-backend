import { TemplateRepository } from '../../app/templates/template.repository';
import { prisma } from '../../infrastructure/db/prisma.client';
import { TemplateChannel } from '../../app/templates/template.types';

jest.mock('../../infrastructure/db/prisma.client', () => ({
  prisma: {
    notificationTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const repo = new TemplateRepository();

describe('TemplateRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a template record', async () => {
      const input = {
        name: 'booking-confirmation',
        channel: TemplateChannel.EMAIL,
        subject: 'Booking Confirmed',
        body: '<p>Hi {{name}}</p>',
      };
      const created = { id: 'tpl-1', ...input };
      (prisma.notificationTemplate.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(input);

      expect(prisma.notificationTemplate.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns template when found', async () => {
      const template = { id: 'tpl-1', name: 'booking-confirmation' };
      (prisma.notificationTemplate.findUnique as jest.Mock).mockResolvedValue(template);

      const result = await repo.findById('tpl-1');

      expect(prisma.notificationTemplate.findUnique).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
      expect(result).toEqual(template);
    });

    it('returns null when not found', async () => {
      (prisma.notificationTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repo.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns template by unique name', async () => {
      const template = { id: 'tpl-1', name: 'booking-confirmation' };
      (prisma.notificationTemplate.findUnique as jest.Mock).mockResolvedValue(template);

      const result = await repo.findByName('booking-confirmation');

      expect(prisma.notificationTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: 'booking-confirmation' },
      });
      expect(result).toEqual(template);
    });
  });

  describe('findAll', () => {
    it('returns all templates ordered by name', async () => {
      const templates = [{ id: 'tpl-1' }, { id: 'tpl-2' }];
      (prisma.notificationTemplate.findMany as jest.Mock).mockResolvedValue(templates);

      const result = await repo.findAll();

      expect(prisma.notificationTemplate.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByChannel', () => {
    it('returns templates for a given channel', async () => {
      const templates = [{ id: 'tpl-1', channel: TemplateChannel.SMS }];
      (prisma.notificationTemplate.findMany as jest.Mock).mockResolvedValue(templates);

      const result = await repo.findByChannel(TemplateChannel.SMS);

      expect(prisma.notificationTemplate.findMany).toHaveBeenCalledWith({
        where: { channel: TemplateChannel.SMS },
      });
      expect(result).toEqual(templates);
    });
  });

  describe('update', () => {
    it('updates a template by id', async () => {
      const updated = { id: 'tpl-1', body: '<p>Updated body</p>' };
      (prisma.notificationTemplate.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.update('tpl-1', { body: '<p>Updated body</p>' });

      expect(prisma.notificationTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: { body: '<p>Updated body</p>' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes template by id', async () => {
      (prisma.notificationTemplate.delete as jest.Mock).mockResolvedValue(undefined);

      await repo.delete('tpl-1');

      expect(prisma.notificationTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
    });
  });
});