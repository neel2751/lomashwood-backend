# Lomashwood Backend Architecture

## Overview

Microservices architecture for Lomashwood furniture platform with the following services:

## Services

### Core Services
- **API Gateway** (Port 3000) - Entry point, routing, authentication
- **Auth Service** (Port 3001) - User authentication, roles, JWT tokens
- **Product Service** (Port 3002) - Product catalog, categories, inventory
- **Order & Payment Service** (Port 3005) - Order processing, payments
- **Appointment Service** (Port 3006) - Showroom appointments
- **Customer Service** (Port 3007) - Customer management, CRM
- **Content Service** (Port 3008) - Blog, pages, CMS

### Supporting Services
- **Notification Service** (Port 3003) - SMS, email, push notifications
- **Analytics Service** (Port 3004) - Event tracking, dashboards, reports
- **Upload Service** (Port 3009) - File uploads, image processing

## Infrastructure

### Database
- **PostgreSQL** - Primary database for all services
- **Redis** - Caching, session storage, queues

### Communication
- **REST APIs** - Service-to-service communication
- **Message Queues** - Async processing (Bull Queue)
- **WebSockets** - Real-time notifications

### Storage
- **AWS S3** - File storage
- **Cloudinary** - Image processing and CDN

## Data Flow

1. Client requests → API Gateway
2. Gateway validates JWT → Route to service
3. Service processes → Database/Cache
4. Async tasks → Queue → Worker processes
5. Events → Analytics Service

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- Encrypted data at rest and in transit

## Scalability

- Horizontal scaling with containerization
- Load balancing with Nginx
- Database read replicas
- Caching layers
- CDN for static assets

## Monitoring

- Application logging
- Performance metrics
- Error tracking
- Health checks
- Analytics dashboard
