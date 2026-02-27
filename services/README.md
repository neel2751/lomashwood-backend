# Lomash Wood Backend - Services

This directory contains all microservices for the Lomash Wood platform. Each service is independently deployable and follows a consistent architecture pattern.

## Architecture Overview

The backend follows a **microservices architecture** pattern with:
- **API Gateway**: Single entry point for all client requests
- **Independent Services**: Each service owns its domain and database
- **Event-Driven Communication**: Services communicate via events
- **Shared Libraries**: Common code in packages directory

## Services

### 1. API Gateway
**Port**: 3000  
**Purpose**: Request routing, authentication, rate limiting, and API aggregation

**Key Features**:
- Route management for all services
- Global middleware (CORS, rate limiting, authentication)
- Request/response transformation
- Service health checks
- API documentation aggregation

**Routes**:
```
/api/v1/auth/*          → auth-service
/api/v1/products/*      → product-service
/api/v1/orders/*        → order-payment-service
/api/v1/payments/*      → order-payment-service
/api/v1/bookings/*      → appointment-service
/api/v1/content/*       → content-service
/api/v1/customers/*     → customer-service
/api/v1/notifications/* → notification-service
/api/v1/analytics/*     → analytics-service
```

### 2. Auth Service
**Port**: 3001  
**Purpose**: User authentication, authorization, and session management

**Responsibilities**:
- User registration and login
- JWT token generation and validation
- Password hashing and verification
- Session management
- Role-based access control (RBAC)
- Password reset functionality
- OAuth integration (future)

**Key Endpoints**:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/reset-password` - Reset password

**Database Schema**:
- Users
- Sessions
- Roles
- Permissions
- RefreshTokens

### 3. Product Service
**Port**: 3002  
**Purpose**: Product catalog, categories, colours, and inventory management

**Responsibilities**:
- Product CRUD operations
- Category management
- Colour and size management
- Inventory tracking
- Product search and filtering
- Pricing management
- Product recommendations

**Key Endpoints**:
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (admin)
- `PATCH /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)
- `GET /categories` - List categories
- `GET /colours` - List colours
- `GET /products/search` - Search products

**Database Schema**:
- Products
- Categories
- Colours
- Sizes
- Inventory
- ProductImages
- ProductColours

### 4. Order Payment Service
**Port**: 3003  
**Purpose**: Order processing, payment handling, and invoice generation

**Responsibilities**:
- Order creation and management
- Shopping cart functionality
- Payment processing (Stripe integration)
- Invoice generation
- Refund handling
- Order status tracking
- Payment reconciliation

**Key Endpoints**:
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `GET /orders/my-orders` - Get user orders
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `POST /payments/refunds` - Create refund
- `GET /cart` - Get cart
- `POST /cart/items` - Add to cart

**Database Schema**:
- Orders
- OrderItems
- Payments
- Refunds
- Invoices
- Cart
- CartItems
- Coupons

### 5. Appointment Service
**Port**: 3004  
**Purpose**: Appointment booking, scheduling, and consultant management

**Responsibilities**:
- Appointment booking
- Time slot management
- Consultant scheduling
- Availability checking
- Booking reminders
- Appointment cancellation/rescheduling
- Showroom management

**Key Endpoints**:
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking details
- `GET /bookings/my-bookings` - Get user bookings
- `PATCH /bookings/:id/cancel` - Cancel booking
- `GET /availability/slots` - Get available slots
- `GET /showrooms` - List showrooms
- `GET /consultants` - List consultants

**Database Schema**:
- Bookings
- TimeSlots
- Consultants
- Showrooms
- Availability
- Reminders

### 6. Content Service
**Port**: 3005  
**Purpose**: CMS functionality, blog posts, media wall, and static content

**Responsibilities**:
- Blog post management
- Media wall content
- Finance content
- Page management
- SEO metadata
- File uploads (S3)
- Content publishing

**Key Endpoints**:
- `GET /blogs` - List blog posts
- `GET /blogs/:slug` - Get blog post
- `POST /blogs` - Create blog post (admin)
- `GET /media-wall` - Get media wall content
- `GET /finance` - Get finance content
- `POST /uploads` - Upload files

**Database Schema**:
- Blogs
- MediaWall
- Finance
- Pages
- SEO
- Media
- Tags
- Categories

### 7. Customer Service
**Port**: 3006  
**Purpose**: Customer profile, wishlist, reviews, and support management

**Responsibilities**:
- Customer profile management
- Address management
- Wishlist functionality
- Product reviews
- Support ticket management
- Loyalty points
- Customer preferences

**Key Endpoints**:
- `GET /customers/profile` - Get profile
- `PATCH /customers/profile` - Update profile
- `GET /addresses` - List addresses
- `POST /addresses` - Add address
- `GET /wishlist` - Get wishlist
- `POST /wishlist/items` - Add to wishlist
- `POST /reviews` - Submit review
- `POST /support/tickets` - Create support ticket

**Database Schema**:
- CustomerProfiles
- Addresses
- Wishlist
- WishlistItems
- Reviews
- SupportTickets
- LoyaltyPoints
- Preferences

### 8. Notification Service
**Port**: 3007  
**Purpose**: Email, SMS, and push notification management

**Responsibilities**:
- Email notifications (Nodemailer/AWS SES)
- SMS notifications (Twilio/MSG91)
- Push notifications (Firebase)
- Notification templates
- User preferences
- Notification scheduling
- Delivery tracking
- Bulk notifications

**Key Endpoints**:
- `POST /notifications/email/send` - Send email
- `POST /notifications/sms/send` - Send SMS
- `POST /notifications/push/send` - Send push notification
- `GET /notifications/preferences` - Get preferences
- `PATCH /notifications/preferences` - Update preferences
- `GET /notifications/history` - Get notification history

**Database Schema**:
- Notifications
- NotificationTemplates
- UserPreferences
- DeliveryStatus
- ScheduledNotifications

### 9. Analytics Service
**Port**: 3008  
**Purpose**: Event tracking, analytics, and reporting

**Responsibilities**:
- Event tracking
- User behavior analytics
- Sales analytics
- Funnel analysis
- Dashboard metrics
- Report generation
- Data aggregation

**Key Endpoints**:
- `POST /analytics/events` - Track event
- `GET /analytics/dashboard` - Get dashboard metrics
- `GET /analytics/revenue` - Get revenue analytics
- `GET /analytics/funnels` - Get funnel data
- `POST /analytics/reports` - Generate report

**Database Schema**:
- Events
- Sessions
- PageViews
- Conversions
- Funnels
- Metrics
- Reports

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: Better Auth
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **API Documentation**: OpenAPI/Swagger

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + Loki
- **Tracing**: Tempo

### External Services
- **Payment Gateway**: Stripe
- **Email Provider**: Nodemailer / AWS SES
- **SMS Provider**: Twilio / MSG91
- **Push Notifications**: Firebase Cloud Messaging
- **File Storage**: AWS S3
- **CDN**: CloudFront

## Getting Started

### Prerequisites
```bash
Node.js v18+
PostgreSQL 14+
Redis 7+
Docker & Docker Compose
pnpm (package manager)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/lomash-wood-backend.git
cd lomash-wood-backend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**
```bash
# Copy example env files for each service
cp services/auth-service/.env.example services/auth-service/.env
cp services/product-service/.env.example services/product-service/.env
# ... repeat for all services
```

4. **Start infrastructure services**
```bash
docker-compose up -d postgres redis
```

5. **Run database migrations**
```bash
# Run migrations for all services
pnpm run migrate
```

6. **Seed database (optional)**
```bash
pnpm run seed
```

7. **Start all services**
```bash
# Development mode with hot reload
pnpm run dev

# Or start individual services
pnpm run dev:auth
pnpm run dev:products
pnpm run dev:orders
```

### Development Workflow

**Start individual service**:
```bash
cd services/auth-service
pnpm run dev
```

**Run tests**:
```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e

# With coverage
pnpm test:coverage
```

**Lint and format**:
```bash
pnpm run lint
pnpm run format
```

**Database operations**:
```bash
# Generate Prisma client
pnpm run prisma:generate

# Create migration
pnpm run prisma:migrate

# View database in Prisma Studio
pnpm run prisma:studio
```

## Service Architecture

Each service follows a consistent layered architecture:

```
service/
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.ts                     # Express app setup
│   ├── bootstrap.ts               # Service initialization
│   ├── app/                       # Business logic layer
│   │   ├── [domain]/
│   │   │   ├── *.controller.ts   # HTTP request handling
│   │   │   ├── *.service.ts      # Business logic
│   │   │   ├── *.repository.ts   # Data access
│   │   │   ├── *.routes.ts       # Route definitions
│   │   │   ├── *.schemas.ts      # Zod validation schemas
│   │   │   ├── *.types.ts        # TypeScript types
│   │   │   ├── *.mapper.ts       # DTO mapping
│   │   │   └── *.constants.ts    # Domain constants
│   ├── infrastructure/            # Infrastructure layer
│   │   ├── db/                   # Database
│   │   ├── cache/                # Redis
│   │   ├── messaging/            # Event bus
│   │   └── http/                 # HTTP server
│   ├── interfaces/                # Interface adapters
│   │   ├── http/                 # HTTP interfaces
│   │   └── events/               # Event interfaces
│   ├── config/                    # Configuration
│   ├── jobs/                      # Background jobs
│   ├── events/                    # Event definitions
│   ├── shared/                    # Shared utilities
│   └── tests-helpers/            # Test utilities
├── tests/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # End-to-end tests
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Database seeding
│   └── migrations/               # Database migrations
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Communication Patterns

### Synchronous Communication
- **REST API**: HTTP/JSON for client-service communication
- **Service-to-Service**: Direct HTTP calls for read operations

### Asynchronous Communication
- **Event Bus**: Redis Pub/Sub or Apache Kafka
- **Message Queue**: For background jobs and delayed tasks

### Event Types
```typescript
// Order events
ORDER_CREATED
ORDER_UPDATED
ORDER_CANCELLED
PAYMENT_SUCCEEDED
PAYMENT_FAILED

// Booking events
BOOKING_CREATED
BOOKING_CANCELLED
REMINDER_SENT

// User events
USER_REGISTERED
USER_PROFILE_UPDATED
USER_DELETED
```

## Environment Variables

Each service requires the following environment variables:

```env
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Service URLs (for inter-service communication)
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003

# External Services
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=lomash-wood-assets
```

## Testing

### Test Structure
```
tests/
├── unit/              # Fast, isolated tests
├── integration/       # Tests with database
└── e2e/              # Full flow tests
```

### Running Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Specific service
cd services/auth-service && pnpm test
```

### Test Conventions
- Use factories for test data
- Mock external dependencies
- Clean up test data after each test
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## API Documentation

### Swagger/OpenAPI
Each service exposes OpenAPI documentation at:
```
http://localhost:300X/api-docs
```

### Postman Collection
Import the Postman collection from:
```
/docs/postman/lomash-wood-api.json
```

## Deployment

### Docker Build
```bash
# Build all services
docker-compose build

# Build specific service
docker build -t lomash-wood/auth-service ./services/auth-service
```

### Kubernetes Deployment
```bash
# Apply configurations
kubectl apply -f infra/kubernetes/base/

# Deploy to specific environment
kubectl apply -f infra/kubernetes/overlays/production/
```

### CI/CD Pipeline
GitHub Actions workflow automatically:
1. Runs tests
2. Builds Docker images
3. Pushes to container registry
4. Deploys to Kubernetes cluster

## Monitoring and Observability

### Health Checks
Each service exposes health endpoints:
```
GET /health          # Overall health
GET /health/db       # Database health
GET /health/redis    # Redis health
GET /health/ready    # Readiness check
GET /health/live     # Liveness check
```

### Metrics
Prometheus metrics available at:
```
GET /metrics
```

### Logging
Structured JSON logs with Winston:
- Request/response logging
- Error tracking
- Performance metrics
- Business events

### Grafana Dashboards
Pre-built dashboards in `/observability/grafana/dashboards/`

## Security

### Best Practices
- All passwords are hashed with bcrypt
- JWT tokens for authentication
- Rate limiting on all endpoints
- CORS configured properly
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection with helmet
- HTTPS only in production

### Secrets Management
- Environment variables for sensitive data
- AWS Secrets Manager for production
- Never commit secrets to git

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

**Database connection error**:
```bash
# Verify PostgreSQL is running
docker-compose ps postgres
# Check connection string
echo $DATABASE_URL
```

**Redis connection error**:
```bash
# Verify Redis is running
docker-compose ps redis
# Test connection
redis-cli ping
```

**Prisma migrations failing**:
```bash
# Reset database (WARNING: Deletes all data)
pnpm run prisma:reset
# Or manually fix migrations
pnpm run prisma:migrate resolve
```

## Contributing

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write tests for new features
- Document complex logic
- Keep functions small and focused

### Git Workflow
1. Create feature branch from `develop`
2. Make changes and commit
3. Write/update tests
4. Create pull request
5. Address review comments
6. Merge to `develop`

### Commit Messages
Follow conventional commits:
```
feat: add user registration endpoint
fix: resolve payment processing bug
docs: update API documentation
test: add unit tests for order service
refactor: simplify authentication logic
```

## Resources

### Documentation
- [Architecture Guide](../../docs/architecture/)
- [API Documentation](../../docs/api/)
- [Database Schema](../../docs/database/)
- [Deployment Guide](../../docs/deployment/)

### External Links
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Stripe API Reference](https://stripe.com/docs/api)

## Support

For questions or issues:
- Create an issue on GitHub
- Contact the backend team
- Check existing documentation
- Review test examples

## License

Copyright © 2026 Lomash Wood. All rights reserved.