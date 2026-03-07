# Development Setup

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Git

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd lomashwood/backend
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install service dependencies
npm run install:all
```

### 3. Environment Variables

Create `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lomashwood_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# AWS (for uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key
FIREBASE_PROJECT_ID=your-firebase-project

# App
NODE_ENV=development
PORT=3000
```

### 4. Database Setup

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
npm run migration:run

# Seed database
npm run seed:run
```

### 5. Start Services

```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:api-gateway
npm run dev:auth-service
npm run dev:product-service
# ... etc
```

## Service Ports

- API Gateway: 3000
- Auth Service: 3001
- Product Service: 3002
- Notification Service: 3003
- Analytics Service: 3004
- Order Service: 3005
- Appointment Service: 3006
- Customer Service: 3007
- Content Service: 3008
- Upload Service: 3009

## Development Tools

### Database

```bash
# Create new migration
npm run migration:create -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Generate entities
npm run entity:generate
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific service
npm run test:auth-service

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Linting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Docker Development

```bash
# Build all services
docker-compose build

# Start development environment
docker-compose up

# Start specific service
docker-compose up auth-service

# View logs
docker-compose logs -f auth-service

# Stop all services
docker-compose down
```

## Common Issues

### Database Connection

Ensure PostgreSQL is running and credentials are correct in `.env`.

### Port Conflicts

Check if ports 3000-3009 are available. Modify ports in `docker-compose.yml` if needed.

### Redis Connection

Verify Redis is running and accessible at `localhost:6379`.

### Module Resolution

If you encounter import errors, run:

```bash
npm run build
```

### Environment Variables

Missing environment variables will cause startup failures. Copy `.env.example` to `.env` and fill values.

## VS Code Setup

Install recommended extensions:

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Docker
- Thunder Client (for API testing)

## Debugging

### VS Code Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Auth Service",
  "program": "${workspaceFolder}/services/auth-service/src/main.ts",
  "outFiles": ["${workspaceFolder}/services/auth-service/dist/**/*.js"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Logging

Logs are configured per service. Check `logs/` directory or console output.

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run linting and tests
5. Submit pull request

## Help

For issues:
- Check logs for error messages
- Verify environment variables
- Ensure all dependencies are running
- Check service health endpoints: `GET /health`
