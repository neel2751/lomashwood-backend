export interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  location?: string;
  roleId?: string;
  securityQuestions?: {
    question: string;
    answer: string;
  }[];
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
  moduleAccess?: string[];
}

export interface UserLoginData {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      roles: string[];
      permissions: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface SecurityQuestionData {
  question: string;
  answer: string;
}

export interface RoleData {
  name: string;
  displayName: string;
  description?: string;
  permissions?: string[];
}

export interface PermissionData {
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
}

export interface SessionData {
  userId: string;
  token: string;
  refreshToken?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}
