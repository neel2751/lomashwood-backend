import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
  toggleActiveSchema,
  bulkPriceUpdateSchema
} from '../../src/app/products/product.schemas';
import { Category } from '@prisma/client';

describe('Product Validators', () => {
  describe('createProductSchema', () => {
    it('should validate a valid kitchen product', () => {
      const validKitchenProduct = {
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: 'KITCHEN',
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg', 'image2.jpg'],
        colourIds: ['colour-1', 'colour-2']
      };

      const result = createProductSchema.parse(validKitchenProduct);

      expect(result).toEqual({
        title: 'Luna White Kitchen',
        description: 'Modern white kitchen with sleek design',
        category: Category.KITCHEN,
        rangeName: 'Luna Collection',
        price: 5999.99,
        images: ['image1.jpg', 'image2.jpg'],
        colourIds: ['colour-1', 'colour-2']
      });
    });

    it('should validate a valid bedroom product with units', () => {
      const validBedroomProduct = {
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: 'BEDROOM',
        rangeName: 'Elegance Collection',
        price: 7499.99,
        images: ['bedroom1.jpg'],
        units: [
          {
            title: 'Single Wardrobe',
            description: 'Compact wardrobe unit',
            image: 'wardrobe.jpg'
          },
          {
            title: 'Double Wardrobe',
            description: 'Spacious double wardrobe',
            image: 'double-wardrobe.jpg'
          }
        ]
      };

      const result = createProductSchema.parse(validBedroomProduct);

      expect(result).toEqual({
        title: 'Elegance Bedroom',
        description: 'Luxurious bedroom suite',
        category: Category.BEDROOM,
        rangeName: 'Elegance Collection',
        price: 7499.99,
        images: ['bedroom1.jpg'],
        units: [
          {
            title: 'Single Wardrobe',
            description: 'Compact wardrobe unit',
            image: 'wardrobe.jpg'
          },
          {
            title: 'Double Wardrobe',
            description: 'Spacious double wardrobe',
            image: 'double-wardrobe.jpg'
          }
        ]
      });
    });

    it('should reject empty title', () => {
      const invalidProduct = {
        title: '',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject missing title', () => {
      const invalidProduct = {
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject title longer than 200 characters', () => {
      const invalidProduct = {
        title: 'A'.repeat(201),
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject empty description', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: '',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject missing description', () => {
      const invalidProduct = {
        title: 'Test Product',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject invalid category', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'INVALID_CATEGORY',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject missing category', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject empty rangeName', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: '',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject missing rangeName', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        price: 5000,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject negative price', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: -100,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject zero price', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 0,
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject missing price', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        images: ['image.jpg']
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject empty images array', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: []
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject missing images', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should accept optional colourIds as empty array', () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        colourIds: []
      };

      const result = createProductSchema.parse(validProduct);
      expect(result.colourIds).toEqual([]);
    });

    it('should accept product without colourIds', () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg']
      };

      const result = createProductSchema.parse(validProduct);
      expect(result.colourIds).toBeUndefined();
    });

    it('should validate unit structure', () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'BEDROOM',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        units: [
          {
            title: 'Unit Title',
            description: 'Unit description',
            image: 'unit.jpg'
          }
        ]
      };

      const result = createProductSchema.parse(validProduct);
      expect(result.units).toHaveLength(1);
      expect(result.units![0].title).toBe('Unit Title');
    });

    it('should reject unit with empty title', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'BEDROOM',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        units: [
          {
            title: '',
            description: 'Unit description',
            image: 'unit.jpg'
          }
        ]
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject unit with empty description', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'BEDROOM',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        units: [
          {
            title: 'Unit Title',
            description: '',
            image: 'unit.jpg'
          }
        ]
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject unit with empty image', () => {
      const invalidProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'BEDROOM',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        units: [
          {
            title: 'Unit Title',
            description: 'Unit description',
            image: ''
          }
        ]
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should accept optional isFeatured field', () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        isFeatured: true
      };

      const result = createProductSchema.parse(validProduct);
      expect(result.isFeatured).toBe(true);
    });

    it('should accept optional isActive field', () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test description',
        category: 'KITCHEN',
        rangeName: 'Test Range',
        price: 5000,
        images: ['image.jpg'],
        isActive: false
      };

      const result = createProductSchema.parse(validProduct);
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateProductSchema', () => {
    it('should validate partial update with title only', () => {
      const partialUpdate = {
        title: 'Updated Title'
      };

      const result = updateProductSchema.parse(partialUpdate);
      expect(result.title).toBe('Updated Title');
    });

    it('should validate partial update with price only', () => {
      const partialUpdate = {
        price: 6999.99
      };

      const result = updateProductSchema.parse(partialUpdate);
      expect(result.price).toBe(6999.99);
    });

    it('should validate partial update with multiple fields', () => {
      const partialUpdate = {
        title: 'Updated Title',
        description: 'Updated description',
        price: 7499.99
      };

      const result = updateProductSchema.parse(partialUpdate);
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated description');
      expect(result.price).toBe(7499.99);
    });

    it('should validate update with colourIds', () => {
      const update = {
        colourIds: ['colour-1', 'colour-3']
      };

      const result = updateProductSchema.parse(update);
      expect(result.colourIds).toEqual(['colour-1', 'colour-3']);
    });

    it('should reject negative price in update', () => {
      const invalidUpdate = {
        price: -100
      };

      expect(() => updateProductSchema.parse(invalidUpdate)).toThrow();
    });

    it('should reject zero price in update', () => {
      const invalidUpdate = {
        price: 0
      };

      expect(() => updateProductSchema.parse(invalidUpdate)).toThrow();
    });

    it('should reject empty title in update', () => {
      const invalidUpdate = {
        title: ''
      };

      expect(() => updateProductSchema.parse(invalidUpdate)).toThrow();
    });

    it('should reject empty images array in update', () => {
      const invalidUpdate = {
        images: []
      };

      expect(() => updateProductSchema.parse(invalidUpdate)).toThrow();
    });

    it('should validate update with category change', () => {
      const update = {
        category: 'BEDROOM'
      };

      const result = updateProductSchema.parse(update);
      expect(result.category).toBe(Category.BEDROOM);
    });

    it('should accept empty update object', () => {
      const emptyUpdate = {};

      const result = updateProductSchema.parse(emptyUpdate);
      expect(result).toEqual({});
    });
  });

  describe('productQuerySchema', () => {
    it('should validate query with default pagination', () => {
      const query = {};

      const result = productQuerySchema.parse(query);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should validate query with custom pagination', () => {
      const query = {
        page: '3',
        limit: '20'
      };

      const result = productQuerySchema.parse(query);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
    });

    it('should validate query with category filter (FR2.0)', () => {
      const query = {
        category: 'KITCHEN'
      };

      const result = productQuerySchema.parse(query);
      expect(result.category).toBe(Category.KITCHEN);
    });

    it('should validate query with colour filter (FR2.2)', () => {
      const query = {
        colourIds: 'colour-1,colour-2,colour-3'
      };

      const result = productQuerySchema.parse(query);
      expect(result.colourIds).toEqual(['colour-1', 'colour-2', 'colour-3']);
    });

    it('should validate query with single colour', () => {
      const query = {
        colourIds: 'colour-1'
      };

      const result = productQuerySchema.parse(query);
      expect(result.colourIds).toEqual(['colour-1']);
    });

    it('should validate query with range filter (FR2.2)', () => {
      const query = {
        rangeName: 'Luna Collection'
      };

      const result = productQuerySchema.parse(query);
      expect(result.rangeName).toBe('Luna Collection');
    });

    it('should validate query with search', () => {
      const query = {
        search: 'Luna White'
      };

      const result = productQuerySchema.parse(query);
      expect(result.search).toBe('Luna White');
    });

    it('should validate query with sort by price (FR2.3)', () => {
      const query = {
        sortBy: 'price',
        sortOrder: 'asc'
      };

      const result = productQuerySchema.parse(query);
      expect(result.sortBy).toBe('price');
      expect(result.sortOrder).toBe('asc');
    });

    it('should validate query with sort by newest (FR2.3)', () => {
      const query = {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = productQuerySchema.parse(query);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should validate query with isActive filter', () => {
      const query = {
        isActive: 'true'
      };

      const result = productQuerySchema.parse(query);
      expect(result.isActive).toBe(true);
    });

    it('should validate query with isFeatured filter', () => {
      const query = {
        isFeatured: 'true'
      };

      const result = productQuerySchema.parse(query);
      expect(result.isFeatured).toBe(true);
    });

    it('should validate query with multiple filters (FR2.2)', () => {
      const query = {
        category: 'KITCHEN',
        colourIds: 'colour-1,colour-2',
        rangeName: 'Luna Collection',
        search: 'white',
        sortBy: 'price',
        sortOrder: 'asc',
        page: '2',
        limit: '20',
        isActive: 'true'
      };

      const result = productQuerySchema.parse(query);
      expect(result.category).toBe(Category.KITCHEN);
      expect(result.colourIds).toEqual(['colour-1', 'colour-2']);
      expect(result.rangeName).toBe('Luna Collection');
      expect(result.search).toBe('white');
      expect(result.sortBy).toBe('price');
      expect(result.sortOrder).toBe('asc');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.isActive).toBe(true);
    });

    it('should reject invalid category', () => {
      const query = {
        category: 'INVALID'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject negative page number', () => {
      const query = {
        page: '-1'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject zero page number', () => {
      const query = {
        page: '0'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject negative limit', () => {
      const query = {
        limit: '-10'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject zero limit', () => {
      const query = {
        limit: '0'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject limit greater than 100', () => {
      const query = {
        limit: '101'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject invalid sort field', () => {
      const query = {
        sortBy: 'invalidField'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });

    it('should reject invalid sort order', () => {
      const query = {
        sortBy: 'price',
        sortOrder: 'invalid'
      };

      expect(() => productQuerySchema.parse(query)).toThrow();
    });
  });

  describe('productIdSchema', () => {
    it('should validate valid UUID', () => {
      const validId = {
        id: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = productIdSchema.parse(validId);
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should validate valid CUID', () => {
      const validId = {
        id: 'clh1234567890abcdefghij'
      };

      const result = productIdSchema.parse(validId);
      expect(result.id).toBe('clh1234567890abcdefghij');
    });

    it('should reject empty id', () => {
      const invalidId = {
        id: ''
      };

      expect(() => productIdSchema.parse(invalidId)).toThrow();
    });

    it('should reject missing id', () => {
      const invalidId = {};

      expect(() => productIdSchema.parse(invalidId)).toThrow();
    });
  });

  describe('toggleActiveSchema', () => {
    it('should validate active status true', () => {
      const data = {
        isActive: true
      };

      const result = toggleActiveSchema.parse(data);
      expect(result.isActive).toBe(true);
    });

    it('should validate active status false', () => {
      const data = {
        isActive: false
      };

      const result = toggleActiveSchema.parse(data);
      expect(result.isActive).toBe(false);
    });

    it('should reject missing isActive', () => {
      const data = {};

      expect(() => toggleActiveSchema.parse(data)).toThrow();
    });

    it('should reject non-boolean isActive', () => {
      const data = {
        isActive: 'true'
      };

      expect(() => toggleActiveSchema.parse(data)).toThrow();
    });
  });

  describe('bulkPriceUpdateSchema', () => {
    it('should validate bulk price updates', () => {
      const data = {
        updates: [
          { id: 'product-1', price: 6999.99 },
          { id: 'product-2', price: 7999.99 },
          { id: 'product-3', price: 8999.99 }
        ]
      };

      const result = bulkPriceUpdateSchema.parse(data);
      expect(result.updates).toHaveLength(3);
      expect(result.updates[0].id).toBe('product-1');
      expect(result.updates[0].price).toBe(6999.99);
    });

    it('should validate single price update', () => {
      const data = {
        updates: [
          { id: 'product-1', price: 6999.99 }
        ]
      };

      const result = bulkPriceUpdateSchema.parse(data);
      expect(result.updates).toHaveLength(1);
    });

    it('should reject empty updates array', () => {
      const data = {
        updates: []
      };

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });

    it('should reject missing updates', () => {
      const data = {};

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });

    it('should reject update with negative price', () => {
      const data = {
        updates: [
          { id: 'product-1', price: -100 }
        ]
      };

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });

    it('should reject update with zero price', () => {
      const data = {
        updates: [
          { id: 'product-1', price: 0 }
        ]
      };

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });

    it('should reject update with missing id', () => {
      const data = {
        updates: [
          { price: 6999.99 }
        ]
      };

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });

    it('should reject update with missing price', () => {
      const data = {
        updates: [
          { id: 'product-1' }
        ]
      };

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });

    it('should reject update with empty id', () => {
      const data = {
        updates: [
          { id: '', price: 6999.99 }
        ]
      };

      expect(() => bulkPriceUpdateSchema.parse(data)).toThrow();
    });
  });
});