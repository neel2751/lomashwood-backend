# Lomash Wood Backend

A comprehensive microservices backend for the Lomash Wood furniture website, built with Node.js, TypeScript, Express, and PostgreSQL.

## 🏗️ Architecture

### Microservices Structure

```
backend/
├── packages/
│   └── api-client/          # Shared API client and types
├── services/
│   ├── api-gateway/         # API Gateway (Port 3000)
│   ├── auth-service/        # Authentication Service (Port 3001)
│   ├── product-service/     # Product Management (Port 3002)
│   ├── order-service/       # Order & Payment (Port 3003)
│   ├── appointment-service/ # Appointment Booking (Port 3004)
│   ├── customer-service/    # Customer Management (Port 3005)
│   ├── content-service/     # CMS & Content (Port 3006)
│   ├── notification-service/ # Notifications (Port 3007)
│   ├── analytics-service/   # Analytics (Port 3008)
│   └── upload-service/      # File Uploads (Port 3009)
├── database/
│   └── prisma/             # Database schema and migrations
├── shared/                 # Shared utilities
└── infra/                  # Infrastructure configs
```

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 (or local storage)
- **Email**: Nodemailer
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm with workspaces
- **Build Tool**: TurboRepo

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and install dependencies**:
```bash
cd backend
pnpm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**:
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

4. **Start development servers**:
```bash
# Start all services
pnpm dev

# Or start individual services
pnpm dev:api-gateway
pnpm dev:auth-service
pnpm dev:product-service
# ... etc
```

### Docker Setup

1. **Start all services with Docker Compose**:
```bash
docker-compose up -d
```

2. **View logs**:
```bash
docker-compose logs -f
```

3. **Stop services**:
```bash
docker-compose down
```

## 📚 API Documentation

### API Gateway (Port 3000)

The API Gateway serves as the single entry point for all client requests.

**Base URL**: `http://localhost:3000`

**Health Check**: `GET /health`

#### Authentication Routes
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Forgot password
- `POST /auth/reset-password` - Reset password
- `POST /auth/change-password` - Change password
- `POST /auth/verify-email` - Verify email
- `POST /auth/resend-verification` - Resend verification

#### Product Routes
- `GET /products` - List products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)

#### Appointment Routes
- `GET /appointments` - List appointments
- `POST /appointments` - Book appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

#### Order Routes
- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `PUT /orders/:id` - Update order status

### Service-Specific Documentation

Each service has its own detailed API documentation:

- [Auth Service Documentation](./services/auth-service/README.md)
- [Product Service Documentation](./services/product-service/README.md)
- [Order Service Documentation](./services/order-service/README.md)
- [Appointment Service Documentation](./services/appointment-service/README.md)
- [Customer Service Documentation](./services/customer-service/README.md)
- [Content Service Documentation](./services/content-service/README.md)
- [Notification Service Documentation](./services/notification-service/README.md)
- [Analytics Service Documentation](./services/analytics-service/README.md)
- [Upload Service Documentation](./services/upload-service/README.md)

## 🗄️ Database Schema

The database schema is defined in Prisma schema file at `database/prisma/schema.prisma`.

### Key Entities

- **Users & Authentication**: Users, Roles, Sessions
- **Products**: Products, Categories, Colours, Sizes, Inventory, Pricing
- **Appointments**: Consultants, Showrooms, Appointments, Availability
- **Orders**: Orders, OrderItems, Payments, Invoices, Refunds
- **Customers**: Reviews, SupportTickets, LoyaltyAccount, Wishlist, SavedDesigns
- **Content**: Blogs, MediaItems, CmsPages, SeoMeta
- **Notifications**: Notifications, NotificationTemplates

### Database Migrations

```bash
# Create new migration
pnpm db:migrate:dev --name <migration-name>

# Apply migrations
pnpm db:migrate:deploy

# Reset database
pnpm db:reset
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lomashwood

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@lomashwood.com

# File Upload
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=lomashwood-uploads

# Payment
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm test:auth-service
pnpm test:product-service

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## 📦 Deployment

### Development

```bash
# Build all services
pnpm build

# Start production servers
pnpm start
```

### Production with Docker

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale auth-service=3
```

### Environment-Specific Configurations

- **Development**: Hot reload, detailed logging, local database
- **Staging**: Production-like environment with test data
- **Production**: Optimized build, security headers, monitoring

## 🔍 Monitoring & Logging

### Health Checks

Each service exposes a `/health` endpoint for monitoring:

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
# ... etc
```

### Logging

- Development: Console logging with Morgan
- Production: Structured logging (Winston recommended)
- Centralized logging: ELK stack or similar

### Metrics

- Application metrics: Request count, response time, error rate
- Database metrics: Connection pool, query performance
- Infrastructure metrics: CPU, memory, disk usage

## 🔒 Security

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session management with Redis

### Security Headers

- Helmet.js for security headers
- CORS configuration
- Rate limiting per endpoint
- Input validation and sanitization

### Best Practices

- Environment variable management
- Secret management (HashiCorp Vault recommended)
- Regular security audits
- Dependency vulnerability scanning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Prettier configuration
- Conventional commits
- 100% test coverage for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Email: support@lomashwood.com
- Documentation: [docs.lomashwood.com](https://docs.lomashwood.com)

## 🗺️ Roadmap

### Phase 1: Core Services ✅
- [x] API Gateway
- [x] Authentication Service
- [x] Product Service
- [x] Order Service
- [x] Appointment Service

### Phase 2: Customer Experience ✅
- [x] Customer Service
- [x] Content Management
- [x] Notification System
- [x] Analytics Dashboard
- [x] File Upload Service

### Phase 3: Advanced Features �
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] AI-powered recommendations
- [ ] Mobile app API

### Phase 4: Scale & Performance 📋
- [x] Caching optimization
- [x] Database optimization
- [x] CDN integration
- [x] Auto-scaling
- [x] Kubernetes deployment
- [x] Production monitoring
