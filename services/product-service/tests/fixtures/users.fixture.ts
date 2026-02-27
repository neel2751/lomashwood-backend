
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

export interface UserFixture {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}


export const adminUserFixtures = {
  superAdmin: {
    id: 'user-admin-super-00000000001',
    email: 'superadmin@lomashwood.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+447700900000',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-12T08:30:00Z'),
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2024-02-12T08:30:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  admin: {
    id: 'user-admin-regular-0000000001',
    email: 'admin@lomashwood.com',
    firstName: 'John',
    lastName: 'Administrator',
    phone: '+447700900001',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-12T09:15:00Z'),
    createdAt: new Date('2023-06-15T00:00:00Z'),
    updatedAt: new Date('2024-02-12T09:15:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  productManager: {
    id: 'user-product-manager-000001',
    email: 'sarah.products@lomashwood.com',
    firstName: 'Sarah',
    lastName: 'Wilson',
    phone: '+447700900002',
    role: UserRole.PRODUCT_MANAGER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-12T08:00:00Z'),
    createdAt: new Date('2023-08-20T00:00:00Z'),
    updatedAt: new Date('2024-02-12T08:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  contentManager: {
    id: 'user-content-manager-00001',
    email: 'mike.content@lomashwood.com',
    firstName: 'Mike',
    lastName: 'Thompson',
    phone: '+447700900003',
    role: UserRole.CONTENT_MANAGER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date('2024-02-11T16:45:00Z'),
    createdAt: new Date('2023-09-10T00:00:00Z'),
    updatedAt: new Date('2024-02-11T16:45:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  customerService: {
    id: 'user-customer-service-0001',
    email: 'emma.support@lomashwood.com',
    firstName: 'Emma',
    lastName: 'Roberts',
    phone: '+447700900004',
    role: UserRole.CUSTOMER_SERVICE,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-12T09:30:00Z'),
    createdAt: new Date('2023-10-05T00:00:00Z'),
    updatedAt: new Date('2024-02-12T09:30:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  suspendedAdmin: {
    id: 'user-admin-suspended-00001',
    email: 'suspended.admin@lomashwood.com',
    firstName: 'Suspended',
    lastName: 'Admin',
    phone: '+447700900005',
    role: UserRole.ADMIN,
    status: UserStatus.SUSPENDED,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2023-07-01T00:00:00Z'),
    updatedAt: new Date('2024-01-20T00:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  deletedAdmin: {
    id: 'user-admin-deleted-000001',
    email: 'deleted.admin@lomashwood.com',
    firstName: 'Deleted',
    lastName: 'Admin',
    phone: null,
    role: UserRole.ADMIN,
    status: UserStatus.DELETED,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date('2023-12-01T10:00:00Z'),
    createdAt: new Date('2023-05-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: new Date('2024-01-01T00:00:00Z'),
  } as const satisfies UserFixture,
};


export const customerUserFixtures = {
  activeCustomer1: {
    id: 'user-customer-active-000001',
    email: 'james.smith@example.com',
    firstName: 'James',
    lastName: 'Smith',
    phone: '+447700901001',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-12T10:30:00Z'),
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-02-12T10:30:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  activeCustomer2: {
    id: 'user-customer-active-000002',
    email: 'olivia.brown@example.com',
    firstName: 'Olivia',
    lastName: 'Brown',
    phone: '+447700901002',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-11T14:20:00Z'),
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-02-11T14:20:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  activeCustomer3: {
    id: 'user-customer-active-000003',
    email: 'william.jones@example.com',
    firstName: 'William',
    lastName: 'Jones',
    phone: '+447700901003',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date('2024-02-10T18:45:00Z'),
    createdAt: new Date('2024-01-25T00:00:00Z'),
    updatedAt: new Date('2024-02-10T18:45:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  vipCustomer: {
    id: 'user-customer-vip-0000001',
    email: 'sophia.miller@example.com',
    firstName: 'Sophia',
    lastName: 'Miller',
    phone: '+447700901004',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-02-12T11:00:00Z'),
    createdAt: new Date('2023-06-01T00:00:00Z'),
    updatedAt: new Date('2024-02-12T11:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  newCustomer: {
    id: 'user-customer-new-00000001',
    email: 'daniel.wilson@example.com',
    firstName: 'Daniel',
    lastName: 'Wilson',
    phone: '+447700901005',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date('2024-02-12T09:00:00Z'),
    createdAt: new Date('2024-02-12T09:00:00Z'),
    updatedAt: new Date('2024-02-12T09:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  pendingVerificationCustomer: {
    id: 'user-customer-pending-00001',
    email: 'isabella.davis@example.com',
    firstName: 'Isabella',
    lastName: 'Davis',
    phone: null,
    role: UserRole.CUSTOMER,
    status: UserStatus.PENDING_VERIFICATION,
    emailVerified: false,
    phoneVerified: false,
    lastLoginAt: null,
    createdAt: new Date('2024-02-12T12:00:00Z'),
    updatedAt: new Date('2024-02-12T12:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  inactiveCustomer: {
    id: 'user-customer-inactive-0001',
    email: 'oliver.taylor@example.com',
    firstName: 'Oliver',
    lastName: 'Taylor',
    phone: '+447700901006',
    role: UserRole.CUSTOMER,
    status: UserStatus.INACTIVE,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2023-09-15T10:00:00Z'),
    createdAt: new Date('2023-05-10T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  suspendedCustomer: {
    id: 'user-customer-suspended-001',
    email: 'ava.anderson@example.com',
    firstName: 'Ava',
    lastName: 'Anderson',
    phone: '+447700901007',
    role: UserRole.CUSTOMER,
    status: UserStatus.SUSPENDED,
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date('2024-01-20T15:30:00Z'),
    createdAt: new Date('2023-11-01T00:00:00Z'),
    updatedAt: new Date('2024-01-25T00:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  deletedCustomer: {
    id: 'user-customer-deleted-00001',
    email: 'deleted.customer@example.com',
    firstName: 'Deleted',
    lastName: 'Customer',
    phone: null,
    role: UserRole.CUSTOMER,
    status: UserStatus.DELETED,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date('2023-12-15T10:00:00Z'),
    createdAt: new Date('2023-08-01T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z'),
    deletedAt: new Date('2024-01-05T00:00:00Z'),
  } as const satisfies UserFixture,

  customerWithoutPhone: {
    id: 'user-customer-no-phone-001',
    email: 'noah.martinez@example.com',
    firstName: 'Noah',
    lastName: 'Martinez',
    phone: null,
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date('2024-02-11T16:00:00Z'),
    createdAt: new Date('2024-02-05T00:00:00Z'),
    updatedAt: new Date('2024-02-11T16:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,

  customerEmailNotVerified: {
    id: 'user-customer-unverified-01',
    email: 'mia.garcia@example.com',
    firstName: 'Mia',
    lastName: 'Garcia',
    phone: '+447700901008',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: false,
    phoneVerified: false,
    lastLoginAt: new Date('2024-02-12T07:30:00Z'),
    createdAt: new Date('2024-02-11T00:00:00Z'),
    updatedAt: new Date('2024-02-12T07:30:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,
};


export const guestUserFixtures = {
  anonymous: {
    id: 'user-guest-anonymous-00001',
    email: 'guest@temporary.local',
    firstName: 'Guest',
    lastName: 'User',
    phone: null,
    role: UserRole.GUEST,
    status: UserStatus.ACTIVE,
    emailVerified: false,
    phoneVerified: false,
    lastLoginAt: null,
    createdAt: new Date('2024-02-12T12:00:00Z'),
    updatedAt: new Date('2024-02-12T12:00:00Z'),
    deletedAt: null,
  } as const satisfies UserFixture,
};


export const userFixtures = {
  admins: adminUserFixtures,
  customers: customerUserFixtures,
  guests: guestUserFixtures,
};



export const getActiveUsers = (): UserFixture[] => {
  return [
    ...Object.values(adminUserFixtures),
    ...Object.values(customerUserFixtures),
    ...Object.values(guestUserFixtures),
  ].filter((user) => user.status === UserStatus.ACTIVE);
};


export const getAdminUsers = (): UserFixture[] => {
  return Object.values(adminUserFixtures).filter(
    (user) =>
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.PRODUCT_MANAGER ||
      user.role === UserRole.CONTENT_MANAGER ||
      user.role === UserRole.CUSTOMER_SERVICE
  );
};


export const getCustomerUsers = (): UserFixture[] => {
  return Object.values(customerUserFixtures);
};


export const getActiveCustomers = (): UserFixture[] => {
  return Object.values(customerUserFixtures).filter(
    (user) => user.status === UserStatus.ACTIVE
  );
};


export const getVerifiedUsers = (): UserFixture[] => {
  return [
    ...Object.values(adminUserFixtures),
    ...Object.values(customerUserFixtures),
  ].filter((user) => user.emailVerified);
};


export const getUsersByRole = (role: UserRole): UserFixture[] => {
  return [
    ...Object.values(adminUserFixtures),
    ...Object.values(customerUserFixtures),
    ...Object.values(guestUserFixtures),
  ].filter((user) => user.role === role);
};

export const getUsersByStatus = (status: UserStatus): UserFixture[] => {
  return [
    ...Object.values(adminUserFixtures),
    ...Object.values(customerUserFixtures),
  ].filter((user) => user.status === status);
};


export const getUserByEmail = (email: string): UserFixture | undefined => {
  return [
    ...Object.values(adminUserFixtures),
    ...Object.values(customerUserFixtures),
    ...Object.values(guestUserFixtures),
  ].find((user) => user.email === email);
};


export const getUserById = (id: string): UserFixture | undefined => {
  return [
    ...Object.values(adminUserFixtures),
    ...Object.values(customerUserFixtures),
    ...Object.values(guestUserFixtures),
  ].find((user) => user.id === id);
};


export const isAdmin = (user: UserFixture): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
    UserRole.CONTENT_MANAGER,
  ].includes(user.role);
};


export const canManageProducts = (user: UserFixture): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCT_MANAGER,
  ].includes(user.role);
};


export const canManageContent = (user: UserFixture): boolean => {
  return [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
  ].includes(user.role);
};


export const canViewProducts = (user: UserFixture): boolean => {
  return user.status === UserStatus.ACTIVE || isAdmin(user);
};


export const createTestUser = (
  overrides: Partial<UserFixture> = {}
): UserFixture => {
  const timestamp = Date.now();
  return {
    id: `test-user-${timestamp}`,
    email: `test.user.${timestamp}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    phone: `+4477009${String(timestamp).slice(-5)}`,
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
};


export const createTestAdminUser = (
  overrides: Partial<UserFixture> = {}
): UserFixture => {
  return createTestUser({
    role: UserRole.ADMIN,
    emailVerified: true,
    phoneVerified: true,
    ...overrides,
  });
};

export const createTestCustomerUser = (
  overrides: Partial<UserFixture> = {}
): UserFixture => {
  return createTestUser({
    role: UserRole.CUSTOMER,
    ...overrides,
  });
};

export const getUsersForPagination = (
  page: number = 1,
  limit: number = 10
): UserFixture[] => {
  const allUsers = getActiveCustomers();
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return allUsers.slice(startIndex, endIndex);
};

export const mockTokens = {
  superAdminToken: 'mock-jwt-token-super-admin-valid',
  adminToken: 'mock-jwt-token-admin-valid',
  productManagerToken: 'mock-jwt-token-product-manager-valid',
  contentManagerToken: 'mock-jwt-token-content-manager-valid',
  customerServiceToken: 'mock-jwt-token-customer-service-valid',
  customerToken: 'mock-jwt-token-customer-valid',
  vipCustomerToken: 'mock-jwt-token-vip-customer-valid',
  guestToken: 'mock-jwt-token-guest-valid',
  expiredToken: 'mock-jwt-token-expired',
  invalidToken: 'mock-jwt-token-invalid',
  malformedToken: 'not-a-valid-jwt-token',
  suspendedUserToken: 'mock-jwt-token-suspended-user',
  deletedUserToken: 'mock-jwt-token-deleted-user',
};


export const getMockTokenForUser = (user: UserFixture): string => {
  const tokenMap: Record<string, string> = {
    [adminUserFixtures.superAdmin.id]: mockTokens.superAdminToken,
    [adminUserFixtures.admin.id]: mockTokens.adminToken,
    [adminUserFixtures.productManager.id]: mockTokens.productManagerToken,
    [adminUserFixtures.contentManager.id]: mockTokens.contentManagerToken,
    [adminUserFixtures.customerService.id]: mockTokens.customerServiceToken,
    [customerUserFixtures.activeCustomer1.id]: mockTokens.customerToken,
    [customerUserFixtures.vipCustomer.id]: mockTokens.vipCustomerToken,
    [guestUserFixtures.anonymous.id]: mockTokens.guestToken,
    [adminUserFixtures.suspendedAdmin.id]: mockTokens.suspendedUserToken,
    [adminUserFixtures.deletedAdmin.id]: mockTokens.deletedUserToken,
  };

  return tokenMap[user.id] || mockTokens.customerToken;
};


export default userFixtures;