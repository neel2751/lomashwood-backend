# Auth Service Tests

## Overview

Comprehensive test suite for the Authentication Service covering unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/               # Unit tests for services, repositories, controllers
├── integration/        # Integration tests for routes and database
├── e2e/               # End-to-end authentication flows
├── fixtures/          # Test data fixtures
└── README.md          # This file
```

## Prerequisites

```bash
npm install
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### End-to-End Tests Only
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Database Setup

### Environment Configuration

Create `.env.test` file:

```env
NODE_ENV=test
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/lomash_auth_test"
JWT_SECRET=test_jwt_secret_key
JWT_REFRESH_SECRET=test_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379/1
```

### Database Migrations

```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Seed Test Data

```bash
npm run seed:test
```

## Unit Tests

### Auth Service Tests

Tests for authentication business logic:

- User registration validation
- Login credential verification
- Password hashing and comparison
- Token generation and validation
- Session management
- Password reset flow
- Email verification
- Account locking mechanism
- MFA token generation

### Session Service Tests

Tests for session management:

- Session creation
- Session validation
- Session refresh
- Session revocation
- Multi-device session handling
- Session cleanup
- Session metadata tracking

### Role Service Tests

Tests for role-based access control:

- Role creation and assignment
- Permission validation
- Role hierarchy
- User role management
- Role-based authorization

## Integration Tests

### Auth Routes Tests

Tests for authentication endpoints:

```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
POST /auth/resend-verification
```

### Session Routes Tests

Tests for session management endpoints:

```
GET    /sessions
GET    /sessions/:id
DELETE /sessions/:id
DELETE /sessions/revoke-all
```

### Role Routes Tests

Tests for role management endpoints:

```
GET    /roles
POST   /roles
GET    /roles/:id
PATCH  /roles/:id
DELETE /roles/:id
POST   /roles/:id/permissions
DELETE /roles/:id/permissions/:permissionId
```

## End-to-End Tests

### Complete Authentication Flow

1. User Registration
2. Email Verification
3. User Login
4. Token Refresh
5. Profile Access
6. Logout
7. Login Again

### Password Reset Flow

1. Request Password Reset
2. Receive Reset Token
3. Validate Reset Token
4. Reset Password
5. Login with New Password

## Test Fixtures

### Users Fixture

```json
{
  "validUser": {
    "email": "test@lomashwood.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+911234567890"
  },
  "adminUser": {
    "email": "admin@lomashwood.com",
    "password": "AdminPass123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }
}
```

### Roles Fixture

```json
{
  "customer": {
    "name": "CUSTOMER",
    "permissions": ["view_products", "create_appointment", "view_profile"]
  },
  "admin": {
    "name": "ADMIN",
    "permissions": ["manage_products", "manage_users", "view_analytics"]
  }
}
```

### Sessions Fixture

```json
{
  "activeSession": {
    "userId": "user-id",
    "userAgent": "Mozilla/5.0",
    "ipAddress": "192.168.1.1",
    "expiresAt": "2026-02-19T10:27:00Z"
  }
}
```

## Test Helpers

### Factory Functions

Located in `tests-helpers/factories.ts`:

- `createUser(overrides?)`
- `createSession(userId, overrides?)`
- `createRole(overrides?)`
- `generateAuthToken(userId)`
- `generateRefreshToken(userId)`

### Mock Services

Located in `tests-helpers/mocks.ts`:

- `mockPrismaClient()`
- `mockRedisClient()`
- `mockEmailService()`
- `mockJwtService()`

### Setup Utilities

Located in `tests-helpers/setup.ts`:

- `setupTestDatabase()`
- `teardownTestDatabase()`
- `clearAllTables()`
- `seedTestData()`

## Coverage Requirements

### Minimum Coverage Thresholds

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### Critical Paths (100% Coverage Required)

- Authentication logic
- Password hashing
- Token generation and validation
- Session management
- Role-based authorization
- Security-critical functions

## Common Test Patterns

### Testing Controllers

```typescript
describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = mockAuthService();
    authController = new AuthController(authService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = mockRequest({
        body: validUserData
      });
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(authService.register).toHaveBeenCalled();
    });
  });
});
```

### Testing Services

```typescript
describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepository = mockAuthRepository();
    authService = new AuthService(authRepository);
  });

  describe('register', () => {
    it('should hash password before saving', async () => {
      const userData = validUserData;
      
      await authService.register(userData);

      const savedUser = authRepository.create.mock.calls[0][0];
      expect(savedUser.password).not.toBe(userData.password);
    });
  });
});
```

### Testing Routes

```typescript
describe('POST /auth/register', () => {
  it('should return 201 with user data', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(validUserData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(validUserData.email);
  });

  it('should return 400 for duplicate email', async () => {
    await createUser(validUserData);

    await request(app)
      .post('/auth/register')
      .send(validUserData)
      .expect(400);
  });
});
```

## Security Testing

### Password Security

- Minimum length validation
- Complexity requirements
- Hash algorithm verification
- Salt uniqueness
- Timing attack prevention

### Token Security

- JWT signature validation
- Token expiration handling
- Refresh token rotation
- Token blacklisting
- CSRF protection

### Session Security

- Session hijacking prevention
- Concurrent session limits
- Session timeout enforcement
- IP address validation
- User agent validation

## Performance Testing

### Load Testing Scenarios

- 100 concurrent registrations
- 1000 concurrent logins
- Token refresh under load
- Session validation performance

### Benchmarks

- Registration: < 200ms
- Login: < 150ms
- Token refresh: < 50ms
- Session validation: < 30ms

## Debugging Tests

### Run Specific Test

```bash
npm test -- auth.service.test.ts
```

### Run Test with Debug Output

```bash
NODE_ENV=test DEBUG=* npm test
```

### Run Single Test Case

```bash
npm test -- -t "should register a new user"
```

## Continuous Integration

### GitHub Actions Workflow

Tests run automatically on:

- Pull requests to main/develop
- Push to main/develop
- Scheduled daily runs

### Test Reports

- Coverage reports uploaded to Codecov
- Test results published in PR comments
- Failed tests trigger notifications

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Mocking**: Mock external dependencies
4. **Assertions**: Use specific assertions
5. **Naming**: Descriptive test names
6. **Coverage**: Aim for critical path coverage
7. **Speed**: Keep unit tests fast
8. **Fixtures**: Use consistent test data
9. **Setup**: Minimal setup per test
10. **Documentation**: Document complex test scenarios

## Troubleshooting

### Database Connection Issues

```bash
docker-compose up -d postgres
npx prisma migrate deploy
```

### Redis Connection Issues

```bash
docker-compose up -d redis
```

### Port Conflicts

```bash
lsof -ti:3001 | xargs kill -9
```

### Stale Snapshots

```bash
npm test -- -u
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)

## Contact

For test-related questions:

- Slack: #auth-service-tests
- Email: dev-team@lomashwood.com