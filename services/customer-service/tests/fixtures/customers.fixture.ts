import { Customer } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS, dateAgo } from './common.fixture';

export const customerFixtures = {
  active: {
    id: FIXED_IDS.customer1,
    userId: FIXED_IDS.userId1,
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Johnson',
    phone: '+44 7700 900001',
    avatarUrl: null,
    isActive: true,
    deletedAt: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies Customer,

  second: {
    id: FIXED_IDS.customer2,
    userId: FIXED_IDS.userId2,
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    phone: null,
    avatarUrl: 'https://cdn.example.com/avatars/bob.jpg',
    isActive: true,
    deletedAt: null,
    createdAt: dateAgo(30),
    updatedAt: dateAgo(5),
  } satisfies Customer,

  inactive: {
    id: FIXED_IDS.customer3,
    userId: FIXED_IDS.userId2,
    email: 'charlie@example.com',
    firstName: 'Charlie',
    lastName: 'Brown',
    phone: null,
    avatarUrl: null,
    isActive: false,
    deletedAt: null,
    createdAt: dateAgo(365),
    updatedAt: dateAgo(180),
  } satisfies Customer,

  deleted: {
    id: FIXED_IDS.deletedCustomer,
    userId: 'usr-deleted-000',
    email: 'deleted@example.com',
    firstName: 'Deleted',
    lastName: 'User',
    phone: null,
    avatarUrl: null,
    isActive: false,
    deletedAt: dateAgo(90),
    createdAt: dateAgo(400),
    updatedAt: dateAgo(90),
  } satisfies Customer,
};

export const createCustomerDto = {
  userId: FIXED_IDS.userId1,
  email: 'newuser@example.com',
  firstName: 'New',
  lastName: 'User',
  phone: '+44 7700 900100',
};

export const updateCustomerDto = {
  firstName: 'Updated',
  lastName: 'Name',
  phone: '+44 7700 900999',
};