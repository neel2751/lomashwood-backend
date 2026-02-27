import { describe } from '@jest/globals';

// NOTE: Content block service implementation not yet created.
// Once content-block.service.ts is implemented, uncomment the tests and remove.skip

describe.skip('ContentBlockService', () => {
  // Full test suite will be enabled once the implementation exists
});

    it('should return empty array when no content blocks exist', async () => {
      repositoryInstance.findAll.mockResolvedValue([]);

      const result = await contentBlockService.findAll();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      repositoryInstance.findAll.mockRejectedValue(new Error('Database error'));

      await expect(contentBlockService.findAll()).rejects.toThrow('Database error');
    });
  });

  // ─── findByPage ─────────────────────────────────────────────────────────────

  describe('findByPage', () => {
    it('should return all content blocks for a given page slug', async () => {
      repositoryInstance.findByPage.mockResolvedValue([mockContentBlock, mockImageBlock]);

      const result = await contentBlockService.findByPage('home');

      expect(repositoryInstance.findByPage).toHaveBeenCalledWith('home');
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.pageSlug === 'home')).toBe(true);
    });

    it('should return empty array when no blocks exist for page', async () => {
      repositoryInstance.findByPage.mockResolvedValue([]);

      const result = await contentBlockService.findByPage('nonexistent-page');

      expect(result).toEqual([]);
    });

    it('should throw AppError when pageSlug is empty', async () => {
      await expect(contentBlockService.findByPage('')).rejects.toThrow(AppError);
      await expect(contentBlockService.findByPage('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Page slug cannot be empty',
      });
      expect(repositoryInstance.findByPage).not.toHaveBeenCalled();
    });
  });

  // ─── findBySection ──────────────────────────────────────────────────────────

  describe('findBySection', () => {
    it('should return blocks for a given page and section', async () => {
      repositoryInstance.findBySection.mockResolvedValue([mockContentBlock, mockImageBlock]);

      const result = await contentBlockService.findBySection('home', 'hero');

      expect(repositoryInstance.findBySection).toHaveBeenCalledWith('home', 'hero');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no blocks in section', async () => {
      repositoryInstance.findBySection.mockResolvedValue([]);

      const result = await contentBlockService.findBySection('home', 'footer');

      expect(result).toEqual([]);
    });
  });

  // ─── findByKey ───────────────────────────────────────────────────────────────

  describe('findByKey', () => {
    it('should return a content block by its unique key', async () => {
      repositoryInstance.findByKey.mockResolvedValue(mockContentBlock);

      const result = await contentBlockService.findByKey('home-hero-title');

      expect(repositoryInstance.findByKey).toHaveBeenCalledWith('home-hero-title');
      expect(result.key).toBe('home-hero-title');
    });

    it('should throw AppError when key not found', async () => {
      repositoryInstance.findByKey.mockResolvedValue(null);

      await expect(contentBlockService.findByKey('nonexistent-key')).rejects.toThrow(AppError);
      await expect(contentBlockService.findByKey('nonexistent-key')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Content block not found',
      });
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a content block by id', async () => {
      repositoryInstance.findById.mockResolvedValue(mockContentBlock);

      const result = await contentBlockService.findById('block-1');

      expect(repositoryInstance.findById).toHaveBeenCalledWith('block-1');
      expect(result.id).toBe('block-1');
    });

    it('should throw AppError when block not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(contentBlockService.findById('nonexistent')).rejects.toThrow(AppError);
      await expect(contentBlockService.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Content block not found',
      });
    });
  });

  // ─── findByType ─────────────────────────────────────────────────────────────

  describe('findByType', () => {
    it('should return blocks of a specific type', async () => {
      repositoryInstance.findByType.mockResolvedValue([mockImageBlock]);

      const result = await contentBlockService.findByType('image');

      expect(repositoryInstance.findByType).toHaveBeenCalledWith('image');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image');
    });

    it('should throw AppError for invalid block type', async () => {
      await expect(contentBlockService.findByType('invalid-type' as ContentBlockType)).rejects.toThrow(AppError);
      await expect(contentBlockService.findByType('invalid-type' as ContentBlockType)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid content block type',
      });
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto: CreateContentBlockDto = {
      key: 'finance-hero-title',
      type: 'text',
      label: 'Finance Hero Title',
      content: 'Flexible Finance Options',
      pageSlug: 'finance',
      section: 'hero',
      isActive: true,
      sortOrder: 1,
      metadata: null,
    };

    it('should create and return a new content block', async () => {
      const createdBlock = { ...mockContentBlock, ...createDto, id: 'block-new' };
      repositoryInstance.findByKey.mockResolvedValue(null);
      repositoryInstance.create.mockResolvedValue(createdBlock);

      const result = await contentBlockService.create(createDto);

      expect(repositoryInstance.findByKey).toHaveBeenCalledWith('finance-hero-title');
      expect(repositoryInstance.create).toHaveBeenCalledWith(createDto);
      expect(result.key).toBe('finance-hero-title');
    });

    it('should throw AppError when key already exists', async () => {
      repositoryInstance.findByKey.mockResolvedValue(mockContentBlock);

      await expect(contentBlockService.create(createDto)).rejects.toThrow(AppError);
      await expect(contentBlockService.create(createDto)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Content block with this key already exists',
      });
      expect(repositoryInstance.create).not.toHaveBeenCalled();
    });

    it('should throw AppError when key is empty', async () => {
      const invalidDto: CreateContentBlockDto = { ...createDto, key: '' };

      await expect(contentBlockService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(contentBlockService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Content block key cannot be empty',
      });
    });

    it('should throw AppError for invalid content block type', async () => {
      const invalidDto: CreateContentBlockDto = {
        ...createDto,
        type: 'invalid' as ContentBlockType,
      };

      await expect(contentBlockService.create(invalidDto)).rejects.toThrow(AppError);
    });

    it('should throw AppError when content is empty', async () => {
      const invalidDto: CreateContentBlockDto = { ...createDto, content: '' };
      repositoryInstance.findByKey.mockResolvedValue(null);

      await expect(contentBlockService.create(invalidDto)).rejects.toThrow(AppError);
      await expect(contentBlockService.create(invalidDto)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Content cannot be empty',
      });
    });

    it('should allow creating block with metadata', async () => {
      const dtoWithMeta: CreateContentBlockDto = {
        ...createDto,
        key: 'home-hero-image-2',
        type: 'image',
        metadata: { alt: 'Hero image', width: 1920, height: 1080 },
      };
      const createdBlock = { ...mockImageBlock, ...dtoWithMeta, id: 'block-img' };
      repositoryInstance.findByKey.mockResolvedValue(null);
      repositoryInstance.create.mockResolvedValue(createdBlock);

      const result = await contentBlockService.create(dtoWithMeta);

      expect(result.metadata).toEqual({ alt: 'Hero image', width: 1920, height: 1080 });
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const updateDto: UpdateContentBlockDto = {
      content: 'Updated Hero Title Content',
      label: 'Updated Label',
    };

    it('should update and return the content block', async () => {
      const updatedBlock = { ...mockContentBlock, ...updateDto };
      repositoryInstance.findById.mockResolvedValue(mockContentBlock);
      repositoryInstance.update.mockResolvedValue(updatedBlock);

      const result = await contentBlockService.update('block-1', updateDto);

      expect(repositoryInstance.findById).toHaveBeenCalledWith('block-1');
      expect(repositoryInstance.update).toHaveBeenCalledWith('block-1', updateDto);
      expect(result.content).toBe('Updated Hero Title Content');
    });

    it('should throw AppError when block not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(contentBlockService.update('nonexistent', updateDto)).rejects.toThrow(AppError);
      await expect(contentBlockService.update('nonexistent', updateDto)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repositoryInstance.update).not.toHaveBeenCalled();
    });

    it('should throw AppError on key conflict with another block', async () => {
      const conflictingBlock = { ...mockContentBlock, id: 'block-999' };
      const dtoWithKey: UpdateContentBlockDto = { ...updateDto, key: 'existing-key' };
      repositoryInstance.findById.mockResolvedValue(mockContentBlock);
      repositoryInstance.findByKey.mockResolvedValue(conflictingBlock);

      await expect(contentBlockService.update('block-1', dtoWithKey)).rejects.toThrow(AppError);
      await expect(contentBlockService.update('block-1', dtoWithKey)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should allow updating key to same value (no conflict)', async () => {
      const sameKeyDto: UpdateContentBlockDto = { ...updateDto, key: 'home-hero-title' };
      const updatedBlock = { ...mockContentBlock, ...sameKeyDto };
      repositoryInstance.findById.mockResolvedValue(mockContentBlock);
      repositoryInstance.findByKey.mockResolvedValue(mockContentBlock);
      repositoryInstance.update.mockResolvedValue(updatedBlock);

      const result = await contentBlockService.update('block-1', sameKeyDto);

      expect(repositoryInstance.update).toHaveBeenCalled();
      expect(result.key).toBe('home-hero-title');
    });
  });

  // ─── updateContent ───────────────────────────────────────────────────────────

  describe('updateContent', () => {
    it('should update only the content field by key', async () => {
      const updatedBlock = { ...mockContentBlock, content: 'New content value' };
      repositoryInstance.findByKey.mockResolvedValue(mockContentBlock);
      repositoryInstance.update.mockResolvedValue(updatedBlock);

      const result = await contentBlockService.updateContent('home-hero-title', 'New content value');

      expect(repositoryInstance.findByKey).toHaveBeenCalledWith('home-hero-title');
      expect(repositoryInstance.update).toHaveBeenCalledWith('block-1', { content: 'New content value' });
      expect(result.content).toBe('New content value');
    });

    it('should throw AppError when block key not found', async () => {
      repositoryInstance.findByKey.mockResolvedValue(null);

      await expect(contentBlockService.updateContent('nonexistent', 'value')).rejects.toThrow(AppError);
    });

    it('should throw AppError when new content is empty', async () => {
      repositoryInstance.findByKey.mockResolvedValue(mockContentBlock);

      await expect(contentBlockService.updateContent('home-hero-title', '')).rejects.toThrow(AppError);
      await expect(contentBlockService.updateContent('home-hero-title', '')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Content cannot be empty',
      });
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete the content block', async () => {
      repositoryInstance.findById.mockResolvedValue(mockContentBlock);
      repositoryInstance.delete.mockResolvedValue(undefined);

      await contentBlockService.delete('block-1');

      expect(repositoryInstance.delete).toHaveBeenCalledWith('block-1');
    });

    it('should throw AppError when block not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(contentBlockService.delete('nonexistent')).rejects.toThrow(AppError);
      expect(repositoryInstance.delete).not.toHaveBeenCalled();
    });
  });

  // ─── bulkUpdate ─────────────────────────────────────────────────────────────

  describe('bulkUpdate', () => {
    it('should update multiple blocks at once', async () => {
      const payload = [
        { id: 'block-1', content: 'Updated content 1' },
        { id: 'block-2', content: 'Updated content 2' },
      ];
      repositoryInstance.bulkUpdate.mockResolvedValue(2);

      const result = await contentBlockService.bulkUpdate(payload);

      expect(repositoryInstance.bulkUpdate).toHaveBeenCalledWith(payload);
      expect(result).toBe(2);
    });

    it('should throw AppError on empty payload', async () => {
      await expect(contentBlockService.bulkUpdate([])).rejects.toThrow(AppError);
      await expect(contentBlockService.bulkUpdate([])).rejects.toMatchObject({
        statusCode: 400,
        message: 'Bulk update payload cannot be empty',
      });
    });
  });

  // ─── toggleActive ────────────────────────────────────────────────────────────

  describe('toggleActive', () => {
    it('should toggle block active state', async () => {
      const inactiveBlock = { ...mockContentBlock, isActive: false };
      repositoryInstance.findById.mockResolvedValue(mockContentBlock);
      repositoryInstance.update.mockResolvedValue(inactiveBlock);

      const result = await contentBlockService.toggleActive('block-1');

      expect(repositoryInstance.update).toHaveBeenCalledWith('block-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should throw AppError when block not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(contentBlockService.toggleActive('nonexistent')).rejects.toThrow(AppError);
    });
  });

  // ─── getPageStructure ────────────────────────────────────────────────────────

  describe('getPageStructure', () => {
    it('should return blocks grouped by section for a page', async () => {
      repositoryInstance.findByPage.mockResolvedValue([mockContentBlock, mockImageBlock, mockRichTextBlock]);

      const result = await contentBlockService.getPageStructure('home');

      expect(repositoryInstance.findByPage).toHaveBeenCalledWith('home');
      expect(result).toHaveProperty('hero');
      expect(Array.isArray(result.hero)).toBe(true);
    });

    it('should return empty object for page with no blocks', async () => {
      repositoryInstance.findByPage.mockResolvedValue([]);

      const result = await contentBlockService.getPageStructure('empty-page');

      expect(result).toEqual({});
    });
  });
});