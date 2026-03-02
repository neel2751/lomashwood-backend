export type PaginationParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ApiError = {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
};

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissionCount?: number;
  userCount?: number;
  createdAt: string;
  updatedAt?: string;
};

export type Session = {
  id: string;
  userName?: string | null;
  userEmail?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
};
export type User = {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  roleName?: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  activeSessionCount?: number;
};