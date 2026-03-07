import { validateSchema, validateAndThrow, emailSchema, passwordSchema, productCreateSchema } from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateSchema', () => {
    it('should return success for valid data', () => {
      const schema = emailSchema;
      const data = { email: 'test@example.com' };

      const result = validateSchema(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return error for invalid data', () => {
      const schema = emailSchema;
      const data = { email: 'invalid-email' };

      const result = validateSchema(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid email format');
      }
    });

    it('should handle complex schemas', () => {
      const data = {
        name: 'Test Product',
        price: 299.99,
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        images: ['https://example.com/image.jpg'],
        sku: 'TEST-001',
        description: 'Test description',
        slug: 'test-product',
      };

      const result = validateSchema(productCreateSchema, data);

      expect(result.success).toBe(true);
    });
  });

  describe('validateAndThrow', () => {
    it('should return data for valid input', () => {
      const schema = emailSchema;
      const data = { email: 'test@example.com' };

      const result = validateAndThrow(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw error for invalid input', () => {
      const schema = emailSchema;
      const data = { email: 'invalid-email' };

      expect(() => validateAndThrow(schema, data)).toThrow();
    });
  });

  describe('emailSchema', () => {
    it('should validate valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@example.com',
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        '',
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse({ email });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('passwordSchema', () => {
    it('should validate valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'MySecure@Pass1',
        'Test#Pass123',
        'Secure$Pass1',
      ];

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        'short', // Too short
        'nouppercase1!', // No uppercase
        'NOLOWERCASE1!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecialChars1', // No special characters
        '12345678', // Only numbers
        'abcdefgh', // Only letters
      ];

      invalidPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });

    it('should enforce minimum length', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });
  });

  describe('productCreateSchema', () => {
    const validProductData = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      price: 299.99,
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      images: ['https://example.com/image.jpg'],
      sku: 'TEST-001',
    };

    it('should validate complete product data', () => {
      const result = productCreateSchema.safeParse(validProductData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = { ...validProductData };
      delete (invalidData as any).name;

      const result = productCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid price', () => {
      const invalidData = { ...validProductData, price: -10 };
      const result = productCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { ...validProductData, categoryId: 'invalid-uuid' };
      const result = productCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty images array', () => {
      const invalidData = { ...validProductData, images: [] };
      const result = productCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URLs', () => {
      const invalidData = { ...validProductData, images: ['not-a-url'] };
      const result = productCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const dataWithOptionals = {
        ...validProductData,
        shortDescription: 'Short description',
        compareAtPrice: 399.99,
        cost: 199.99,
        weight: 5.5,
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        seoKeywords: 'SEO Keywords',
      };

      const result = productCreateSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('complex validation scenarios', () => {
    it('should handle nested object validation', () => {
      const schema = productCreateSchema;
      const data = {
        ...productCreateSchema.parse({
          name: 'Test',
          slug: 'test',
          description: 'Test',
          price: 100,
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
          images: ['https://example.com/image.jpg'],
          sku: 'TEST-001',
        }),
        dimensions: {
          length: 100,
          width: 50,
          height: 30,
          unit: 'cm',
        },
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle array validation', () => {
      const data = {
        ...productCreateSchema.parse({
          name: 'Test',
          slug: 'test',
          description: 'Test',
          price: 100,
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
          images: ['https://example.com/image.jpg'],
          sku: 'TEST-001',
        }),
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      const result = productCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should provide detailed error messages', () => {
      const invalidData = {
        name: '', // Empty name
        slug: 'invalid slug with spaces',
        description: '',
        price: -100, // Negative price
        categoryId: 'invalid-uuid',
        images: ['not-a-url'],
        sku: '',
      };

      const result = productCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errors = result.error.errors;
        expect(errors.length).toBeGreaterThan(0);
        
        // Check for specific error messages
        const errorMessages = errors.map(e => e.message);
        expect(errorMessages.some(msg => msg.includes('name'))).toBe(true);
        expect(errorMessages.some(msg => msg.includes('price'))).toBe(true);
        expect(errorMessages.some(msg => msg.includes('UUID'))).toBe(true);
        expect(errorMessages.some(msg => msg.includes('url'))).toBe(true);
      }
    });
  });
});
