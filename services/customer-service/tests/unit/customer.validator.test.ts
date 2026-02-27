import { createProfileSchema, updateProfileSchema } from '../../src/app/profiles/profile.schemas';

describe('Profile Validators', () => {
  describe('createProfileSchema', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+441234567890',
      postcode: 'SW1A 1AA',
      address: '10 Downing Street, London',
    };

    it('should pass with valid data', () => {
      const result = createProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should fail when firstName is missing', () => {
      const { firstName, ...rest } = validInput;
      const result = createProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should fail when lastName is missing', () => {
      const { lastName, ...rest } = validInput;
      const result = createProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should fail when phone is missing', () => {
      const { phone, ...rest } = validInput;
      const result = createProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should fail when postcode is missing', () => {
      const { postcode, ...rest } = validInput;
      const result = createProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should fail when address is missing', () => {
      const { address, ...rest } = validInput;
      const result = createProfileSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should fail when firstName is empty string', () => {
      const result = createProfileSchema.safeParse({ ...validInput, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when lastName is empty string', () => {
      const result = createProfileSchema.safeParse({ ...validInput, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when phone is too short', () => {
      const result = createProfileSchema.safeParse({ ...validInput, phone: '123' });
      expect(result.success).toBe(false);
    });

    it('should fail when postcode is empty string', () => {
      const result = createProfileSchema.safeParse({ ...validInput, postcode: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when address is empty string', () => {
      const result = createProfileSchema.safeParse({ ...validInput, address: '' });
      expect(result.success).toBe(false);
    });

    it('should fail with extra unknown fields when strict', () => {
      const result = createProfileSchema.safeParse({ ...validInput, unknownField: 'value' });
      expect(result.success).toBe(false);
    });

    it('should strip extra fields with strip mode', () => {
      const result = createProfileSchema.strip().safeParse({ ...validInput, unknownField: 'value' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).unknownField).toBeUndefined();
      }
    });
  });

  describe('updateProfileSchema', () => {
    it('should pass with partial valid data', () => {
      const result = updateProfileSchema.safeParse({ phone: '+449999999999' });
      expect(result.success).toBe(true);
    });

    it('should pass with all fields provided', () => {
      const result = updateProfileSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+449999999999',
        postcode: 'EC1A 1BB',
        address: '1 London Bridge',
      });
      expect(result.success).toBe(true);
    });

    it('should pass with empty object (all optional)', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should fail when firstName is empty string', () => {
      const result = updateProfileSchema.safeParse({ firstName: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when lastName is empty string', () => {
      const result = updateProfileSchema.safeParse({ lastName: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when phone is too short', () => {
      const result = updateProfileSchema.safeParse({ phone: '123' });
      expect(result.success).toBe(false);
    });

    it('should fail when postcode is empty string', () => {
      const result = updateProfileSchema.safeParse({ postcode: '' });
      expect(result.success).toBe(false);
    });

    it('should fail when address is empty string', () => {
      const result = updateProfileSchema.safeParse({ address: '' });
      expect(result.success).toBe(false);
    });
  });
});