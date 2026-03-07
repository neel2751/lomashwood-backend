# Development Guide

This guide will help you set up and develop the Lomash Wood Backend Microservices.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional but recommended)

### Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the setup script:**
   
   **Windows (PowerShell):**
   ```powershell
   .\scripts\setup.ps1
   ```
   
   **Linux/macOS:**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   
   **Windows (PowerShell):**
   ```powershell
   .\scripts\start-dev.ps1
   ```
   
   **Linux/macOS:**
   ```bash
   chmod +x scripts/start-dev.sh
   ./scripts/start-dev.sh
   ```

## 🏗️ Architecture

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Central entry point, routing, authentication |
| Auth Service | 3001 | User authentication, JWT tokens |
| Product Service | 3002 | Product catalog, inventory |
| Order Service | 3003 | Order management, payments |
| Appointment Service | 3004 | Appointment booking, scheduling |
| Customer Service | 3005 | Customer profiles, support |
| Content Service | 3006 | CMS, blogs, media |
| Notification Service | 3007 | Email, SMS, push notifications |
| Analytics Service | 3008 | Event tracking, dashboards |
| Upload Service | 3009 | File uploads, image processing |

### Database Schema

The complete database schema is defined in `database/prisma/schema.prisma`. Key entities include:

- **Users & Authentication**: Users, Roles, Sessions
- **Products**: Products, Categories, Colours, Sizes, Inventory
- **Orders**: Orders, Payments, Invoices, Refunds
- **Appointments**: Appointments, Consultants, Showrooms
- **Customers**: Customers, Reviews, SupportTickets, Wishlists
- **Content**: Blogs, MediaItems, CmsPages, Showrooms
- **Notifications**: Notifications, EmailLogs, SmsLogs, PushLogs
- **Analytics**: Events, Dashboards, Widgets, Funnels

## 🔧 Development Commands

### Available Scripts

```bash
# Install dependencies
pnpm install

# Start all services in development mode
pnpm dev

# Start specific service
pnpm dev:api-gateway
pnpm dev:auth-service
pnpm dev:product-service
# ... etc

# Build all services
pnpm build

# Build specific service
pnpm build:api-gateway
pnpm build:auth-service
# ... etc

# Run tests
pnpm test

# Run tests for specific service
pnpm test:api-gateway
pnpm test:auth-service
# ... etc

# Database operations
pnpm db:generate    # Generate Prisma client
pnpm db:migrate      # Run migrations
pnpm db:studio      # Open Prisma Studio
pnpm db:seed        # Seed database with mock data

# Linting and formatting
pnpm lint
pnpm lint:fix
pnpm format

# Clean build artifacts
pnpm clean

# Docker operations
pnpm docker:up
pnpm docker:down
pnpm docker:logs
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run specific service tests
pnpm test:auth-service
pnpm test:product-service
# ... etc
```

### Test Structure

Each service has its own test suite:

```
services/
├── auth-service/
│   ├── src/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
```

## 🐳 Docker Development

### Using Docker Compose

```bash
# Start all services with database
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Individual Service Docker

```bash
# Build specific service
docker-compose build auth-service

# Start specific service
docker-compose up auth-service

# Run service with hot reload
docker-compose up --build auth-service
```

## 🔍 Debugging

### VS Code Debugging

1. Install the recommended extensions
2. Use the provided launch configurations in `.vscode/launch.json`
3. Set breakpoints in your code
4. Start debugging with F5

### Common Debugging Scenarios

**Service not starting:**
- Check port conflicts
- Verify environment variables
- Check logs with `pnpm logs:service-name`

**Database connection issues:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run `pnpm db:migrate`

**Authentication issues:**
- Verify JWT secrets
- Check API Gateway routing
- Verify CORS configuration

## 📝 API Documentation

### Local API Documentation

Start the services and visit:
- API Gateway: http://localhost:3000/health
- Auth Service: http://localhost:3001/health
- Product Service: http://localhost:3002/health
- ... etc

### API Client Usage

```typescript
import { ApiClient } from '@lomashwood/api-client';

const apiClient = new ApiClient({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

// Use services
const products = await apiClient.productService.getProducts();
const user = await apiClient.authService.login(credentials);
```

## 🔄 Hot Reload

All services support hot reload in development mode. Changes to source files will automatically restart the service.

## 📊 Monitoring

### Health Checks

Each service exposes a `/health` endpoint:

```bash
curl http://localhost:3000/health
```

### Logs

View logs for all services:
```bash
pnpm logs
```

View logs for specific service:
```bash
pnpm logs:auth-service
```

## 🚀 Deployment

### Environment Variables

Key environment variables for production:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-production-secret
# ... other production variables
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛠️ Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>
```

**Permission denied on scripts:**
```bash
chmod +x scripts/*.sh
```

**Docker issues:**
```bash
# Clean Docker
docker system prune -f

# Rebuild containers
docker-compose up --build
```

### Getting Help

- Check the [README.md](./README.md) for overview
- Review service-specific documentation in each service directory
- Check logs for error messages
- Use the provided scripts for common operations

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [pnpm Documentation](https://pnpm.io/)
