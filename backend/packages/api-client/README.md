# Lomash Wood API Client

A comprehensive TypeScript API client for the Lomash Wood backend microservices.

## 🚀 Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Service-Based**: Organized by service (Auth, Products, Orders, etc.)
- **Error Handling**: Built-in error handling and validation
- **File Upload**: Support for file uploads with progress tracking
- **Real-time**: Support for real-time features and analytics
- **Extensible**: Easy to extend with new services and utilities

## 📦 Installation

```bash
npm install @lomashwood/api-client
# or
pnpm add @lomashwood/api-client
```

## 🔧 Setup

```typescript
import { HttpClient, authService, productService } from '@lomashwood/api-client';

// Create HTTP client
const httpClient = new HttpClient({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create service instances
const auth = authService(httpClient);
const products = productService(httpClient);
```

## 📚 Services

### Authentication Service

```typescript
import { authService } from '@lomashwood/api-client';

const auth = authService(httpClient);

// Login
const { data } = await auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Register
const { data } = await auth.register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Get profile
const { data } = await auth.getProfile();
```

### Product Service

```typescript
import { productService } from '@lomashwood/api-client';

const products = productService(httpClient);

// Get all products
const { data } = await products.getProducts({
  page: 1,
  limit: 20,
  category: 'kitchen'
});

// Get single product
const { data } = await products.getProduct('product-id');

// Search products
const { data } = await products.searchProducts('wooden table');
```

### Order Service

```typescript
import { orderService } from '@lomashwood/api-client';

const orders = orderService(httpClient);

// Create order
const { data } = await orders.createOrder({
  customerId: 'customer-id',
  items: [
    {
      productId: 'product-id',
      quantity: 2,
      unitPrice: 299.99
    }
  ],
  shippingAddress: {
    street: '123 Main St',
    city: 'London',
    postalCode: 'SW1A 1AA',
    country: 'UK'
  }
});

// Get order history
const { data } = await orders.getCustomerOrders('customer-id');
```

### Appointment Service

```typescript
import { appointmentService } from '@lomashwood/api-client';

const appointments = appointmentService(httpClient);

// Book appointment
const { data } = await appointments.createAppointment({
  customerId: 'customer-id',
  type: 'SHOWROOM',
  serviceType: 'KITCHEN',
  scheduledDate: '2024-03-15',
  scheduledTime: '14:00',
  duration: 60,
  customerDetails: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+447123456789'
  }
});
```

### Customer Service

```typescript
import { customerService } from '@lomashwood/api-client';

const customers = customerService(httpClient);

// Get customer profile
const { data } = await customers.getCustomerProfile('customer-id');

// Update preferences
const { data } = await customers.updateCustomerPreferences('customer-id', {
  newsletter: true,
  notifications: false
});
```

### Content Service

```typescript
import { contentService } from '@lomashwood/api-client';

const content = contentService(httpClient);

// Get blog posts
const { data } = await content.getBlogs({
  page: 1,
  limit: 10,
  category: 'kitchen-design'
});

// Upload media
const { data } = await content.uploadMedia(file, {
  alt: 'Kitchen design image',
  category: 'kitchen',
  tags: ['modern', 'wooden']
});
```

### Notification Service

```typescript
import { notificationService } from '@lomashwood/api-client';

const notifications = notificationService(httpClient);

// Send notification
const { data } = await notifications.sendUserNotification('user-id', {
  title: 'Order Confirmed',
  message: 'Your order has been confirmed!',
  type: 'INFO',
  channels: ['EMAIL', 'IN_APP']
});
```

### Analytics Service

```typescript
import { analyticsService } from '@lomashwood/api-client';

const analytics = analyticsService(httpClient);

// Track event
const { data } = await analytics.trackEvent({
  type: 'PAGE_VIEW',
  data: {
    page: '/products/kitchen-tables',
    userId: 'user-id'
  }
});

// Get analytics
const { data } = await analytics.getOverviewStats({
  startDate: '2024-03-01',
  endDate: '2024-03-31'
});
```

### Upload Service

```typescript
import { uploadService } from '@lomashwood/api-client';

const uploads = uploadService(httpClient);

// Upload file
const { data } = await uploads.uploadFile(file, {
  category: 'product-images',
  alt: 'Product image',
  tags: ['kitchen', 'modern']
});

// Process image
const { data } = await uploads.processFile('file-id', {
  resize: { width: 800, height: 600, fit: 'cover' },
  compress: { quality: 80, format: 'webp' }
});
```

## 🔧 Advanced Usage

### Custom HTTP Client

```typescript
import { HttpClient } from '@lomashwood/api-client';

const httpClient = new HttpClient({
  baseURL: 'https://api.lomashwood.com',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1'
  },
  // Request interceptor
  requestInterceptor: (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // Response interceptor
  responseInterceptor: (response) => {
    // Handle global response logic
    return response;
  },
  // Error handler
  errorHandler: (error) => {
    if (error.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    }
    throw error;
  }
});
```

### Error Handling

```typescript
import { handleApiError, ApiError } from '@lomashwood/api-client';

try {
  const { data } = await products.getProducts();
} catch (error) {
  const apiError = handleApiError(error);
  
  if (apiError instanceof ApiError) {
    console.error('API Error:', apiError.message);
    console.error('Status:', apiError.status);
    console.error('Code:', apiError.code);
  }
}
```

### Validation

```typescript
import { validateSchema, productCreateSchema } from '@lomashwood/api-client';

const productData = {
  name: 'Modern Kitchen Table',
  price: 299.99,
  // ... other fields
};

const validation = validateSchema(productCreateSchema, productData);

if (!validation.success) {
  console.error('Validation errors:', validation.error);
} else {
  // Proceed with API call
  const { data } = await products.createProduct(validation.data);
}
```

### File Upload with Progress

```typescript
const uploadFile = async (file: File) => {
  try {
    const { data } = await uploads.uploadFile(file, {
      category: 'product-images'
    }, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${progress}%`);
      }
    });
    
    console.log('File uploaded:', data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## 📝 Type Definitions

The API client includes comprehensive TypeScript types for all entities:

```typescript
// Example types
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  // ... other fields
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 🛠️ Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

## 📋 API Coverage

- ✅ **Authentication** - Login, register, profile management
- ✅ **Products** - CRUD, search, categories, variants
- ✅ **Orders** - Create, manage, payments, refunds
- ✅ **Appointments** - Booking, scheduling, availability
- ✅ **Customers** - Profiles, preferences, support
- ✅ **Content** - Blogs, media, CMS pages, showrooms
- ✅ **Notifications** - Multi-channel notifications
- ✅ **Analytics** - Event tracking, dashboards, reports
- ✅ **Uploads** - File management, processing, storage

## 🔒 Security

- JWT token handling
- Request/response interceptors
- Input validation
- Error handling
- Type safety

## 📞 Support

For support and questions:

- Create an issue in the repository
- Email: api-support@lomashwood.com
- Documentation: [docs.lomashwood.com](https://docs.lomashwood.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
