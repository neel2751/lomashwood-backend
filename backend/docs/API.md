# Lomashwood API Documentation

## Base URLs

- **Development**: `http://localhost:3000/api/v1`
- **Staging**: `https://staging-api.lomashwood.com/api/v1`
- **Production**: `https://api.lomashwood.com/api/v1`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Common Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Core Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Products
- `GET /products` - List products (with pagination)
- `GET /products/:id` - Get product details
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)
- `GET /products/categories` - List categories

### Orders
- `GET /orders` - List user orders
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order status
- `POST /orders/:id/payment` - Process payment

### Appointments
- `GET /appointments` - List appointments
- `POST /appointments` - Book appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

### Content
- `GET /blog/posts` - List blog posts
- `GET /blog/posts/:slug` - Get blog post
- `GET /showrooms` - List showrooms
- `GET /showrooms/:id` - Get showroom details

## Supporting Services

### Notifications
- `POST /notifications/sms` - Send SMS
- `POST /notifications/email` - Send email
- `POST /notifications/push` - Send push notification
- `GET /notifications/templates` - List templates
- `POST /notifications/templates` - Create template

### Analytics
- `POST /analytics/events/track` - Track event
- `GET /analytics/events` - Get events
- `GET /analytics/dashboards` - List dashboards
- `GET /analytics/reports` - Get reports

### Uploads
- `POST /uploads/file` - Upload file
- `GET /uploads/presigned-url` - Get presigned URL
- `GET /uploads/files` - List files
- `DELETE /uploads/files/:id` - Delete file

## Error Handling

Errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common error codes:
- `UNAUTHORIZED` - Invalid or missing token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

- **Authenticated users**: 1000 requests/hour
- **Anonymous users**: 100 requests/hour
- **Upload endpoints**: 50 requests/hour

## Pagination

List endpoints support pagination:

```
GET /products?page=1&limit=20&sortBy=name&sortOrder=asc
```

Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (max: 100)
- `sortBy` - Sort field
- `sortOrder` - Sort direction (asc/desc)

## Webhooks

Webhooks are sent for important events:

- `order.created` - New order created
- `payment.completed` - Payment successful
- `appointment.booked` - Appointment booked
- `user.registered` - New user registration

Configure webhook URLs in the admin panel.
