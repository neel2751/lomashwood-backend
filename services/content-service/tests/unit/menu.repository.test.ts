import { MenuRepository } from '../../src/app/cms/menu.repository';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('@prisma/client');

describe('MenuRepository', () => {
  let menuRepository: MenuRepository;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockMenu = {
    id: 'menu-1',
    name: 'Main Navigation',
    slug: 'main-navigation',
    location: 'header',
    isActive: true,
    items: [
      {
        id: 'item-1',
        menuId: 'menu-1',
        label: 'Home',
        url: '/',
        order: 1,
        parentId: null,
        target: '_self',
        isActive: true,
        children: [],
      },
    ],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    menuRepository = new MenuRepository(prisma);
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all menus with their items', async () => {
      (prisma.menu.findMany as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await menuRepository.findAll();

      expect(prisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ items: true }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('menu-1');
    });

    it('should return empty array when no menus exist', async () => {
      (prisma.menu.findMany as jest.Mock).mockResolvedValue([]);

      const result = await menuRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a menu by id including nested items', async () => {
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(mockMenu);

      const result = await menuRepository.findById('menu-1');

      expect(prisma.menu.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'menu-1' },
        }),
      );
      expect(result).toEqual(mockMenu);
    });

    it('should return null when menu not found', async () => {
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await menuRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── findBySlug ─────────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should return a menu by slug', async () => {
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(mockMenu);

      const result = await menuRepository.findBySlug('main-navigation');

      expect(prisma.menu.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'main-navigation' },
        }),
      );
      expect(result?.slug).toBe('main-navigation');
    });

    it('should return null when slug not found', async () => {
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await menuRepository.findBySlug('nonexistent-slug');

      expect(result).toBeNull();
    });
  });

  // ─── findByLocation ─────────────────────────────────────────────────────────

  describe('findByLocation', () => {
    it('should return menus by location', async () => {
      (prisma.menu.findMany as jest.Mock).mockResolvedValue([mockMenu]);

      const result = await menuRepository.findByLocation('header');

      expect(prisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { location: 'header' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array for unknown location', async () => {
      (prisma.menu.findMany as jest.Mock).mockResolvedValue([]);

      const result = await menuRepository.findByLocation('sidebar');

      expect(result).toEqual([]);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a menu with nested items', async () => {
      const createData = {
        name: 'Footer Menu',
        slug: 'footer-menu',
        location: 'footer',
        isActive: true,
        items: [{ label: 'Contact', url: '/contact', order: 1, target: '_self', isActive: true }],
      };
      const createdMenu = { ...mockMenu, ...createData, id: 'menu-2' };
      (prisma.menu.create as jest.Mock).mockResolvedValue(createdMenu);

      const result = await menuRepository.create(createData);

      expect(prisma.menu.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Footer Menu' }),
        }),
      );
      expect(result.slug).toBe('footer-menu');
    });

    it('should handle create with no items', async () => {
      const createData = {
        name: 'Empty Menu',
        slug: 'empty-menu',
        location: 'header',
        isActive: true,
        items: [],
      };
      const createdMenu = { ...mockMenu, ...createData, id: 'menu-3', items: [] };
      (prisma.menu.create as jest.Mock).mockResolvedValue(createdMenu);

      const result = await menuRepository.create(createData);

      expect(result.items).toEqual([]);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a menu', async () => {
      const updateData = { name: 'Updated Navigation', isActive: false };
      const updatedMenu = { ...mockMenu, ...updateData };
      (prisma.menu.update as jest.Mock).mockResolvedValue(updatedMenu);

      const result = await menuRepository.update('menu-1', updateData);

      expect(prisma.menu.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'menu-1' },
          data: expect.objectContaining({ name: 'Updated Navigation' }),
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should throw when updating nonexistent menu', async () => {
      (prisma.menu.update as jest.Mock).mockRejectedValue({ code: 'P2025' });

      await expect(menuRepository.update('nonexistent', { name: 'x' })).rejects.toBeDefined();
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete a menu and cascade items', async () => {
      (prisma.menu.delete as jest.Mock).mockResolvedValue(mockMenu);

      await menuRepository.delete('menu-1');

      expect(prisma.menu.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'menu-1' } }),
      );
    });
  });

  // ─── addItem ─────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('should add a menu item and return updated menu', async () => {
      const newItem = { label: 'About', url: '/about', order: 2, target: '_self', isActive: true };
      const updatedMenu = {
        ...mockMenu,
        items: [...mockMenu.items, { id: 'item-new', menuId: 'menu-1', parentId: null, children: [], ...newItem }],
      };
      (prisma.menuItem.create as jest.Mock).mockResolvedValue({ id: 'item-new', menuId: 'menu-1', parentId: null, ...newItem });
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(updatedMenu);

      const result = await menuRepository.addItem('menu-1', newItem);

      expect(prisma.menuItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ menuId: 'menu-1', label: 'About' }),
        }),
      );
      expect(result.items).toHaveLength(2);
    });
  });

  // ─── removeItem ──────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('should remove a menu item and return updated menu', async () => {
      const updatedMenu = { ...mockMenu, items: [] };
      (prisma.menuItem.delete as jest.Mock).mockResolvedValue(mockMenu.items[0]);
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(updatedMenu);

      const result = await menuRepository.removeItem('menu-1', 'item-1');

      expect(prisma.menuItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-1' } }),
      );
      expect(result.items).toHaveLength(0);
    });
  });

  // ─── reorderItems ────────────────────────────────────────────────────────────

  describe('reorderItems', () => {
    it('should reorder items using a transaction', async () => {
      const reorderPayload = [{ id: 'item-1', order: 2 }];
      const updatedMenu = { ...mockMenu };
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);
      (prisma.menu.findUnique as jest.Mock).mockResolvedValue(updatedMenu);

      const result = await menuRepository.reorderItems('menu-1', reorderPayload);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedMenu);
    });
  });
});