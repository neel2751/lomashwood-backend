import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const fixedDate = new Date('2025-01-15T10:00:00.000Z');
export const fixedDateString = '2025-01-15T10:00:00.000Z';

export const mockPaginationMeta = {
  page: 1,
  perPage: 10,
  total: 100,
  totalPages: 10,
  hasNextPage: true,
  hasPreviousPage: false,
};

export const mockPaginationQuery = {
  page: 1,
  perPage: 10,
};

export const mockAdminUser = {
  id: generateId(),
  email: 'admin@lomashwood.com',
  role: 'ADMIN',
  name: 'Admin User',
};

export const mockStaffUser = {
  id: generateId(),
  email: 'staff@lomashwood.com',
  role: 'STAFF',
  name: 'Staff User',
};

export const mockCustomerUser = {
  id: generateId(),
  email: 'customer@example.com',
  role: 'CUSTOMER',
  name: 'Customer User',
};

export const mockAuditFields = {
  createdAt: fixedDate,
  updatedAt: fixedDate,
  deletedAt: null,
};

export const mockCreatedByFields = {
  createdById: mockAdminUser.id,
  updatedById: mockAdminUser.id,
};

export const buildMockEntity = <T extends object>(overrides: Partial<T> = {}): T => {
  return {
    id: generateId(),
    ...mockAuditFields,
    ...overrides,
  } as T;
};

export const mockS3BaseUrl = 'https://cdn.lomashwood.com';

export const mockImageUrl = (filename: string): string =>
  `${mockS3BaseUrl}/images/${filename}`;

export const mockVideoUrl = (filename: string): string =>
  `${mockS3BaseUrl}/videos/${filename}`;

export const mockSlugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();