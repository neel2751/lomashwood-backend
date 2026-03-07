import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import 'express-async-errors';
import { config } from './config/configuration';
import { ContentController } from './content/content.controller';
import { ApiResponse } from '../../../packages/api-client/src/types/api.types';

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors(config.cors));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and documents
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    },
  } as ApiResponse);
});

// Content routes
const contentController = new ContentController();

// Blog routes
app.get('/blogs', contentController.getBlogs.bind(contentController));
app.get('/blogs/:id', contentController.getBlog.bind(contentController));
app.post('/blogs', contentController.createBlog.bind(contentController));
app.put('/blogs/:id', contentController.updateBlog.bind(contentController));
app.delete('/blogs/:id', contentController.deleteBlog.bind(contentController));

// Media routes
app.get('/media', contentController.getMediaItems.bind(contentController));
app.post('/media/upload', upload.single('file'), contentController.uploadMedia.bind(contentController));

// CMS page routes
app.get('/cms-pages', contentController.getCmsPages.bind(contentController));
app.get('/cms-pages/:id', contentController.getCmsPage.bind(contentController));
app.post('/cms-pages', contentController.createCmsPage.bind(contentController));
app.put('/cms-pages/:id', contentController.updateCmsPage.bind(contentController));

// Showroom routes
app.get('/showrooms', contentController.getShowrooms.bind(contentController));

// Landing page routes
app.get('/landing-pages', contentController.getLandingPages.bind(contentController));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  } as ApiResponse);
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR',
    ...(config.isDevelopment && { stack: error.stack }),
  } as ApiResponse);
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Content Service is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔍 Environment: ${config.env}`);
});
