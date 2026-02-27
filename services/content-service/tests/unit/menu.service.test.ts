import { MenuService } from '../../src/app/cms/menu.service';
import { MenuRepository } from '../../src/app/cms/menu.repository';
import { AppError } from '../../src/shared/errors';
import { CreateMenuDto, UpdateMenuDto, MenuItemDto } from '../../src/app/cms/menu.types';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/app/cms/menu.repository');

const mockMenuRepository = MenuRepository as jest.MockedClass<typeof MenuRepository>;

describe('MenuService', () => {
  let menuService: MenuService;
  let repositoryInstance: jest.Mocked<MenuRepository>;

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
      {
        id: 'item-2',
        menuId: 'menu-1',
        label: 'Kitchens',
        url: '/kitchens',
        order: 2,
        parentId: null,
        target: '_self',
        isActive: true,
        children: [],
      },
    ],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockMenuItem: MenuItemDto = {
    label: 'Bedrooms',
    url: '/bedrooms',
    order: 3,
    parentId: null,
    target: '_self',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryInstance = new mockMenuRepository() as jest.Mocked<MenuRepository>;
    (mockMenuRepository as unknown as jest.Mock).mockReturnValue(repositoryInstance);
    menuService = new MenuService(repositoryInstance);
  });


  describe('findAll', () => {
    it('should return all menus', async () => {
      repositoryInstance.findAll.mockResolvedValue([mockMenu]);

      const result = await menuService.findAll();

      expect(repositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('menu-1');
    });

    it('should return empty array when no menus exist', async () => {
      repositoryInstance.findAll.mockResolvedValue([]);

      const result = await menuService.findAll();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      repositoryInstance.findAll.mockRejectedValue(new Error('Database error'));

      await expect(menuService.findAll()).rejects.toThrow('Database error');
    });
  });


  describe('findById', () => {
    it('should return a menu by id', async () => {
      repositoryInstance.findById.mockResolvedValue(mockMenu);

      const result = await menuService.findById('menu-1');

      expect(repositoryInstance.findById).toHaveBeenCalledWith('menu-1');
      expect(result.id).toBe('menu-1');
    });

    it('should throw AppError when menu not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(menuService.findById('nonexistent')).rejects.toThrow(AppError);
      await expect(menuService.findById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Menu not found',
      });
    });
  });


  describe('findByLocation', () => {
    it('should return menus by location', async () => {
      repositoryInstance.findByLocation.mockResolvedValue([mockMenu]);

      const result = await menuService.findByLocation('header');

      expect(repositoryInstance.findByLocation).toHaveBeenCalledWith('header');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no menus exist for location', async () => {
      repositoryInstance.findByLocation.mockResolvedValue([]);

      const result = await menuService.findByLocation('footer');

      expect(result).toEqual([]);
    });
  });


  describe('create', () => {
    const createDto: CreateMenuDto = {
      name: 'Footer Menu',
      slug: 'footer-menu',
      location: 'footer',
      isActive: true,
      items: [],
    };

    it('should create and return a new menu', async () => {
      const createdMenu = { ...mockMenu, ...createDto, id: 'menu-2' };
      repositoryInstance.findBySlug.mockResolvedValue(null);
      repositoryInstance.create.mockResolvedValue(createdMenu);

      const result = await menuService.create(createDto);

      expect(repositoryInstance.findBySlug).toHaveBeenCalledWith('footer-menu');
      expect(repositoryInstance.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe('Footer Menu');
    });

    it('should throw AppError when slug already exists', async () => {
      repositoryInstance.findBySlug.mockResolvedValue(mockMenu);

      await expect(menuService.create(createDto)).rejects.toThrow(AppError);
      await expect(menuService.create(createDto)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Menu with this slug already exists',
      });
      expect(repositoryInstance.create).not.toHaveBeenCalled();
    });

    it('should auto-generate slug if not provided', async () => {
      const dtoWithoutSlug = { ...createDto, slug: undefined };
      const createdMenu = { ...mockMenu, slug: 'footer-menu', id: 'menu-2' };
      repositoryInstance.findBySlug.mockResolvedValue(null);
      repositoryInstance.create.mockResolvedValue(createdMenu);

      await menuService.create(dtoWithoutSlug as CreateMenuDto);

      expect(repositoryInstance.create).toHaveBeenCalled();
    });
  });


  describe('update', () => {
    const updateDto: UpdateMenuDto = {
      name: 'Updated Navigation',
      isActive: false,
    };

    it('should update and return the menu', async () => {
      const updatedMenu = { ...mockMenu, ...updateDto };
      repositoryInstance.findById.mockResolvedValue(mockMenu);
      repositoryInstance.update.mockResolvedValue(updatedMenu);

      const result = await menuService.update('menu-1', updateDto);

      expect(repositoryInstance.findById).toHaveBeenCalledWith('menu-1');
      expect(repositoryInstance.update).toHaveBeenCalledWith('menu-1', updateDto);
      expect(result.name).toBe('Updated Navigation');
    });

    it('should throw AppError when menu not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(menuService.update('nonexistent', updateDto)).rejects.toThrow(AppError);
      await expect(menuService.update('nonexistent', updateDto)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repositoryInstance.update).not.toHaveBeenCalled();
    });

    it('should throw AppError on slug conflict with another menu', async () => {
      const dtoWithSlug: UpdateMenuDto = { ...updateDto, slug: 'main-navigation' };
      const conflictMenu = { ...mockMenu, id: 'menu-999' };
      repositoryInstance.findById.mockResolvedValue(mockMenu);
      repositoryInstance.findBySlug.mockResolvedValue(conflictMenu);

      await expect(menuService.update('menu-1', dtoWithSlug)).rejects.toThrow(AppError);
      await expect(menuService.update('menu-1', dtoWithSlug)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });


  describe('delete', () => {
    it('should delete the menu', async () => {
      repositoryInstance.findById.mockResolvedValue(mockMenu);
      repositoryInstance.delete.mockResolvedValue(undefined);

      await menuService.delete('menu-1');

      expect(repositoryInstance.delete).toHaveBeenCalledWith('menu-1');
    });

    it('should throw AppError when menu not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(menuService.delete('nonexistent')).rejects.toThrow(AppError);
      expect(repositoryInstance.delete).not.toHaveBeenCalled();
    });
  });


  describe('addMenuItem', () => {
    it('should add a menu item and return updated menu', async () => {
      const updatedMenu = {
        ...mockMenu,
        items: [...mockMenu.items, { id: 'item-3', menuId: 'menu-1', ...mockMenuItem, children: [] }],
      };
      repositoryInstance.findById.mockResolvedValue(mockMenu);
      repositoryInstance.addItem.mockResolvedValue(updatedMenu);

      const result = await menuService.addMenuItem('menu-1', mockMenuItem);

      expect(repositoryInstance.findById).toHaveBeenCalledWith('menu-1');
      expect(repositoryInstance.addItem).toHaveBeenCalledWith('menu-1', mockMenuItem);
      expect(result.items).toHaveLength(3);
    });

    it('should throw AppError when menu not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(menuService.addMenuItem('nonexistent', mockMenuItem)).rejects.toThrow(AppError);
    });

    it('should validate parent item exists if parentId provided', async () => {
      const itemWithParent: MenuItemDto = { ...mockMenuItem, parentId: 'nonexistent-parent' };
      repositoryInstance.findById.mockResolvedValue(mockMenu);

      await expect(menuService.addMenuItem('menu-1', itemWithParent)).rejects.toThrow(AppError);
      await expect(menuService.addMenuItem('menu-1', itemWithParent)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Parent menu item not found',
      });
    });
  });


  describe('removeMenuItem', () => {
    it('should remove a menu item', async () => {
      repositoryInstance.findById.mockResolvedValue(mockMenu);
      repositoryInstance.removeItem.mockResolvedValue({ ...mockMenu, items: [mockMenu.items[0]] });

      const result = await menuService.removeMenuItem('menu-1', 'item-2');

      expect(repositoryInstance.removeItem).toHaveBeenCalledWith('menu-1', 'item-2');
      expect(result.items).toHaveLength(1);
    });

    it('should throw AppError when item does not belong to menu', async () => {
      repositoryInstance.findById.mockResolvedValue(mockMenu);

      await expect(menuService.removeMenuItem('menu-1', 'nonexistent-item')).rejects.toThrow(AppError);
    });
  });


  describe('reorderItems', () => {
    it('should reorder menu items', async () => {
      const reorderPayload = [
        { id: 'item-2', order: 1 },
        { id: 'item-1', order: 2 },
      ];
      const reorderedMenu = {
        ...mockMenu,
        items: [
          { ...mockMenu.items[1], order: 1 },
          { ...mockMenu.items[0], order: 2 },
        ],
      };
      repositoryInstance.findById.mockResolvedValue(mockMenu);
      repositoryInstance.reorderItems.mockResolvedValue(reorderedMenu);

      const result = await menuService.reorderItems('menu-1', reorderPayload);

      expect(repositoryInstance.reorderItems).toHaveBeenCalledWith('menu-1', reorderPayload);
      expect(result.items[0].label).toBe('Kitchens');
    });

    it('should throw AppError when menu not found', async () => {
      repositoryInstance.findById.mockResolvedValue(null);

      await expect(menuService.reorderItems('nonexistent', [])).rejects.toThrow(AppError);
    });
  });
});