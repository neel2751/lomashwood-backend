interface TokenPayload {
  id: string;
  role: string;
  email?: string;
}

export interface TestAuthHeaders {
  Authorization: string;
  'x-user-payload': string;
}

export function generateAdminToken(payload: TokenPayload): string {
  const userPayload = {
    id: payload.id,
    email: payload.email ?? `${payload.id}@test.com`,
    role: payload.role,
  };
  return Buffer.from(JSON.stringify(userPayload)).toString('base64');
}

export function generateAuthHeaders(payload: TokenPayload): TestAuthHeaders {
  const base64Payload = generateAdminToken(payload);
  return {
    Authorization: 'Bearer test-token',
    'x-user-payload': base64Payload,
  };
}

export function generateUserToken(payload: TokenPayload): string {
  return generateAdminToken({ ...payload, role: payload.role ?? 'USER' });
}

// Mock tokens for tests
export const mockAdminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });
export const mockUserToken = generateUserToken({ id: 'user-1', role: 'USER' });