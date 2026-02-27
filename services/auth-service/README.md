# Auth Service

Enterprise-grade authentication and authorization microservice for Lomash Wood platform.

## Overview

The Auth Service handles all authentication, authorization, session management, and user identity operations for the Lomash Wood platform. Built with Node.js, Express, TypeScript, PostgreSQL, and Better Auth.

## Features

- **User Authentication**
  - Email/Password registration and login
  - JWT-based authentication
  - Refresh token rotation
  - Session management
  - Multi-device support

- **Authorization**
  - Role-based access control (RBAC)
  - Permission-based authorization
  - Role hierarchy support
  - Dynamic permission assignment

- **Security**
  - Password hashing with bcrypt
  - JWT token blacklisting
  - Rate limiting
  - CSRF protection
  - Account lockout after failed attempts
  - IP-based access control

- **Account Management**
  - Email verification
  - Password reset flow
  - Profile management
  - Account deactivation
  - Session revocation

- **Audit & Compliance**
  - Authentication event logging
  - Session tracking
  - Security audit trails
  - GDPR compliance features

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Validation**: Zod
- **Cache**: Redis
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI 3.0

## Project Structure

```
auth-service/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── migrations/            # Database migrations
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.ts                # Express app configuration
│   ├── bootstrap.ts          # Service bootstrapping
│   ├── app/
│   │   ├── auth/             # Authentication module
│   │   ├── sessions/         # Session management module
│   │   └── roles/            # Role management module
│   ├── infrastructure/
│   │   ├── db/               # Database clients and helpers
│   │   ├── cache/            # Redis clients and helpers
│   │   ├── auth/             # JWT, password, OTP utilities
│   │   ├── messaging/        # Event producers
│   │   └── http/             # HTTP server and health checks
│   ├── interfaces/
│   │   ├── http/             # Express routes and middleware
│   │   ├── events/           # Event handlers
│   │   └── cron/             # Scheduled jobs
│   ├── config/               # Configuration management
│   ├── jobs/                 # Background jobs
│   ├── events/               # Domain events
│   ├── shared/               # Shared utilities and types
│   └── tests-helpers/        # Test utilities
├── tests/                    # Test suites
├── .env.example              # Environment variables template
├── Dockerfile                # Container definition
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Prerequisites

- Node.js >= 20.x
- PostgreSQL >= 15.x
- Redis >= 7.x
- pnpm >= 8.x

## Installation

### 1. Clone and Install Dependencies

```bash
cd services/auth-service
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following variables:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=postgresql://user:password@localhost:5432/lomash_auth
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

SESSION_MAX_AGE=604800000
SESSION_COOKIE_NAME=lomash_session
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

ACCOUNT_LOCKOUT_THRESHOLD=5
ACCOUNT_LOCKOUT_DURATION=900000

EMAIL_FROM=noreply@lomashwood.com
EMAIL_SERVICE_URL=http://localhost:3007

CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

LOG_LEVEL=info
LOG_FORMAT=json

API_GATEWAY_URL=http://localhost:3000
```

### 3. Database Setup

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

Seed initial data:

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The service will be available at `http://localhost:3001`

## Database Schema

### User

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String
  firstName         String?
  lastName          String?
  phone             String?
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  isActive          Boolean   @default(true)
  isLocked          Boolean   @default(false)
  lockedAt          DateTime?
  failedLoginAttempts Int     @default(0)
  lastLoginAt       DateTime?
  lastLoginIp       String?
  roleId            String?
  role              Role?     @relation(fields: [roleId], references: [id])
  sessions          Session[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### Session

```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Role

```prisma
model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### Permission

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  resource    String
  action      String
  roles       Role[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### Authentication

#### Register User

```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+911234567890"
}

Response: 201 Created
{
  "user": {
    "id": "user_123",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "user": {
    "id": "user_123",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Refresh Token

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout

```http
POST /v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

#### Get Current User

```http
GET /v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "id": "user_123",
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": {
    "id": "role_1",
    "name": "CUSTOMER",
    "permissions": [...]
  }
}
```

#### Forgot Password

```http
POST /v1/auth/forgot-password
Content-Type: application/json

{
  "email": "customer@example.com"
}

Response: 200 OK
{
  "message": "Password reset email sent"
}
```

#### Reset Password

```http
POST /v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_123",
  "password": "NewSecurePass123!"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

#### Verify Email

```http
POST /v1/auth/verify-email
Content-Type: application/json

{
  "token": "verify_token_123"
}

Response: 200 OK
{
  "message": "Email verified successfully"
}
```

### Session Management

#### Get All Sessions

```http
GET /v1/sessions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "sessions": [
    {
      "id": "session_1",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-02-12T10:00:00Z",
      "expiresAt": "2026-02-19T10:00:00Z",
      "isCurrent": true
    }
  ]
}
```

#### Revoke Session

```http
DELETE /v1/sessions/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "message": "Session revoked successfully"
}
```

#### Revoke All Sessions

```http
DELETE /v1/sessions/revoke-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "message": "All sessions revoked successfully"
}
```

### Role Management

#### List Roles

```http
GET /v1/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "roles": [
    {
      "id": "role_1",
      "name": "CUSTOMER",
      "description": "Customer role",
      "permissions": [...]
    }
  ]
}
```

#### Create Role

```http
POST /v1/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "DESIGNER",
  "description": "Interior designer role",
  "permissions": ["view_products", "create_designs"]
}

Response: 201 Created
{
  "id": "role_2",
  "name": "DESIGNER",
  "description": "Interior designer role"
}
```

#### Update Role

```http
PATCH /v1/roles/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "description": "Updated description"
}

Response: 200 OK
{
  "id": "role_2",
  "name": "DESIGNER",
  "description": "Updated description"
}
```

### Health Check

```http
GET /health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2026-02-12T10:27:00Z",
  "uptime": 123456,
  "database": "connected",
  "redis": "connected"
}
```

## Authentication Flow

### Registration Flow

1. Client sends registration request with email, password, and profile data
2. Service validates input using Zod schemas
3. Service checks if email already exists
4. Password is hashed using bcrypt
5. User record is created in database
6. Email verification token is generated
7. Verification email is sent via notification service
8. JWT access and refresh tokens are generated
9. Session is created and stored
10. Tokens and user data are returned to client

### Login Flow

1. Client sends login request with email and password
2. Service validates input
3. User is fetched from database by email
4. Account lock status is checked
5. Password is verified using bcrypt
6. Failed login attempts are reset on success
7. Session is created
8. JWT tokens are generated
9. Last login timestamp and IP are updated
10. Tokens and user data are returned

### Token Refresh Flow

1. Client sends refresh token
2. Service validates refresh token signature and expiration
3. Token is checked against blacklist
4. New access token is generated
5. New refresh token is generated (rotation)
6. Old refresh token is blacklisted
7. Session is updated
8. New tokens are returned

## Security Features

### Password Policy

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Lockout

- Locks account after 5 failed login attempts
- Lockout duration: 15 minutes
- Automatically unlocks after duration
- Manual unlock available for admins

### Token Security

- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Refresh token rotation on each use
- Token blacklisting on logout
- Signature verification on all requests

### Session Security

- Secure HTTP-only cookies
- CSRF token validation
- IP address tracking
- User agent tracking
- Concurrent session limits
- Session timeout enforcement

## Events Published

### UserCreated

```json
{
  "eventType": "user.created",
  "userId": "user_123",
  "email": "customer@example.com",
  "role": "CUSTOMER",
  "timestamp": "2026-02-12T10:27:00Z"
}
```

### UserLoggedIn

```json
{
  "eventType": "user.logged_in",
  "userId": "user_123",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-02-12T10:27:00Z"
}
```

### PasswordReset

```json
{
  "eventType": "user.password_reset",
  "userId": "user_123",
  "ipAddress": "192.168.1.1",
  "timestamp": "2026-02-12T10:27:00Z"
}
```

### RoleUpdated

```json
{
  "eventType": "role.updated",
  "roleId": "role_1",
  "userId": "user_123",
  "changes": {
    "permissions": ["added_permission_1", "removed_permission_2"]
  },
  "timestamp": "2026-02-12T10:27:00Z"
}
```

## Background Jobs

### Cleanup Sessions Job

Runs daily at 2:00 AM

- Removes expired sessions
- Cleans up blacklisted tokens
- Archives old session data

### Rotate Tokens Job

Runs every 6 hours

- Rotates system tokens
- Updates API keys
- Refreshes encryption keys

### Expire Password Reset Job

Runs every hour

- Expires password reset tokens after 1 hour
- Cleans up verification tokens after 24 hours

### Deactivate Inactive Users Job

Runs monthly

- Marks users inactive after 180 days of no activity
- Sends reactivation emails
- Archives inactive account data

## Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests

```bash
npm run test:unit
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Generate Coverage Report

```bash
npm run test:coverage
```

## Development

### Code Style

```bash
npm run lint
npm run format
```

### Type Checking

```bash
npm run type-check
```

### Database Operations

```bash
npx prisma studio
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push
```

## Deployment

### Docker Build

```bash
docker build -t lomash-auth-service:latest .
```

### Docker Run

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  lomash-auth-service:latest
```

### Docker Compose

```bash
docker-compose up -d
```

### Kubernetes Deployment

```bash
kubectl apply -f kubernetes/base/deployments/auth-service.yaml
kubectl apply -f kubernetes/base/services/auth-service.yaml
```

## Monitoring

### Health Endpoints

- `/health` - Overall service health
- `/health/db` - Database connectivity
- `/health/redis` - Redis connectivity

### Metrics

Available at `/metrics`:

- Request count
- Request duration
- Active sessions
- Failed login attempts
- Token generation rate

### Logging

Structured JSON logs with levels:

- ERROR: System errors and exceptions
- WARN: Security events, account lockouts
- INFO: Authentication events, registrations
- DEBUG: Detailed flow information

## Troubleshooting

### Database Connection Issues

```bash
npx prisma db push
npx prisma migrate deploy
```

### Redis Connection Issues

```bash
docker-compose restart redis
```

### Token Validation Failures

Check JWT_SECRET environment variable matches between services

### Session Issues

Clear Redis cache:

```bash
redis-cli FLUSHDB
```

## Performance Optimization

### Database Indexes

- Email (unique)
- Session token (unique)
- User ID + Session ID (composite)
- Role name (unique)

### Caching Strategy

- User sessions: 7 days TTL
- Role permissions: 1 hour TTL
- Blacklisted tokens: Until expiration

### Rate Limiting

- Registration: 5 per hour per IP
- Login: 10 per hour per IP
- Password reset: 3 per hour per email
- Token refresh: 100 per hour per user

## Security Best Practices

1. Always use HTTPS in production
2. Rotate JWT secrets regularly
3. Enable CSRF protection
4. Implement rate limiting
5. Use secure session cookies
6. Monitor failed login attempts
7. Keep dependencies updated
8. Run security audits regularly
9. Implement proper CORS policies
10. Use environment-specific configurations

## Contributing

1. Create feature branch
2. Write tests for new features
3. Ensure all tests pass
4. Run linting and formatting
5. Update documentation
6. Submit pull request

## License

Proprietary - Lomash Wood Private Limited

## Support

For issues and questions:

- Email: dev-team@lomashwood.com
- Slack: #auth-service
- Documentation: https://docs.lomashwood.com/auth-service