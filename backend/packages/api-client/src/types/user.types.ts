export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export type UserRole = 'ADMIN' | 'USER' | 'MODERATOR' | 'GUEST';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
}

export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  createdAfter?: string;
  createdBefore?: string;
}