import { TemplateService } from '../../app/templates/template.service';
import { TemplateRepository } from '../../app/templates/template.repository';
import { TemplateChannel } from '../../app/templates/template.types';

jest.mock('../../app/templates/template.repository');

const mockRepo = new TemplateRepository() as jest.Mocked<TemplateRepository>;
const service = new TemplateService(mockRepo);

describe('TemplateService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a template record', async () => {
      const input = {
        name: 'welcome-email',
        channel: TemplateChannel.EMAIL,
        subject: 'Welcome to Lomash Wood',
        body: '<p>Hello {{name}}</p>',
      };
      const created = { id: 'tpl-1', ...input };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns template when found', async () => {
      const template = { id: 'tpl-1', name: 'welcome-email' };
      mockRepo.findById.mockResolvedValue(template);

      const result = await service.findById('tpl-1');

      expect(result).toEqual(template);
    });

    it('returns null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('returns template by name', async () => {
      const template = { id: 'tpl-1', name: 'welcome-email' };
      mockRepo.findByName.mockResolvedValue(template);

      const result = await service.findByName('welcome-email');

      expect(mockRepo.findByName).toHaveBeenCalledWith('welcome-email');
      expect(result).toEqual(template);
    });
  });

  describe('findAll', () => {
    it('returns all templates', async () => {
      const templates = [{ id: 'tpl-1' }, { id: 'tpl-2' }];
      mockRepo.findAll.mockResolvedValue(templates);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('render', () => {
    it('renders template body with given variables', async () => {
      const template = {
        id: 'tpl-1',
        name: 'welcome-email',
        channel: TemplateChannel.EMAIL,
        subject: 'Welcome {{name}}',
        body: '<p>Hello {{name}}, your code is {{code}}</p>',
      };
      mockRepo.findByName.mockResolvedValue(template);

      const result = await service.render('welcome-email', { name: 'Jake', code: '1234' });

      expect(result.subject).toBe('Welcome Jake');
      expect(result.body).toBe('<p>Hello Jake, your code is 1234</p>');
    });

    it('throws when template not found', async () => {
      mockRepo.findByName.mockResolvedValue(null);

      await expect(service.render('missing-template', {})).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates a template', async () => {
      const updated = { id: 'tpl-1', body: '<p>Updated</p>' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('tpl-1', { body: '<p>Updated</p>' });

      expect(mockRepo.update).toHaveBeenCalledWith('tpl-1', { body: '<p>Updated</p>' });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes a template', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await service.delete('tpl-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('tpl-1');
    });
  });
});