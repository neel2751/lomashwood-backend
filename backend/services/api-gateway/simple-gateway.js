const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8000;

console.log('🚀 Starting API Gateway...');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'http://localhost:3001',
      products: 'http://localhost:3002',
      appointments: 'http://localhost:3004'
    }
  });
});

// Proxy middleware for auth service (running on port 3001)
const authProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  },
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Auth service is unavailable',
      error: 'AUTH_SERVICE_DOWN'
    });
  }
});

// Proxy middleware for product service (when ready)
const productProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/products': '',
  },
  onError: (err, req, res) => {
    console.error('Product service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Product service is unavailable',
      error: 'PRODUCT_SERVICE_DOWN'
    });
  }
});

// Proxy middleware for appointment service (when ready)
const appointmentProxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/appointments': '',
  },
  onError: (err, req, res) => {
    console.error('Appointment service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Appointment service is unavailable',
      error: 'APPOINTMENT_SERVICE_DOWN'
    });
  }
});

// Routes
app.use('/auth', authProxy);
app.use('/products', productProxy);
app.use('/appointments', appointmentProxy);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    availableRoutes: ['/health', '/auth/*', '/products/*', '/appointments/*']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Gateway error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth proxy: http://localhost:${PORT}/auth/* -> http://localhost:3001/*`);
  console.log(`📦 Product proxy: http://localhost:${PORT}/products/* -> http://localhost:3002/*`);
  console.log(`📅 Appointment proxy: http://localhost:${PORT}/appointments/* -> http://localhost:3004/*`);
});
