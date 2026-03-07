import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import 'express-async-errors';
import { config } from './config/configuration';


interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  [key: string]: any;
}

const app = express();

app.use(helmet());
app.use(cors(config.cors));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

app.get('/health', (req: Request, res: Response) => {
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

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file provided', error: 'NO_FILE' } as ApiResponse);
    return;
  }
  res.json({ success: true, data: { file: req.file, body: req.body } });
});

app.post('/upload/multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    res.status(400).json({ success: false, message: 'No files provided', error: 'NO_FILES' } as ApiResponse);
    return;
  }
  res.json({ success: true, data: { files: req.files, body: req.body } });
});

app.get('/files', async (req: Request, res: Response) => {
  res.json({ success: true, data: { query: req.query } });
});

app.get('/files/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

app.delete('/files/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

app.post('/files/:id/transform', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, transform: req.body } });
});

app.get('/stats', async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
});

app.get('/presigned-url', async (req: Request, res: Response) => {
  const { filename, contentType } = req.query as { filename: string; contentType: string };
  res.json({ success: true, data: { filename, contentType } });
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  } as ApiResponse);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size exceeds limit',
        error: 'FILE_TOO_LARGE',
      } as ApiResponse);
      return;
    }
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR',
    ...(config.isDevelopment && { stack: error.stack }),
  } as ApiResponse);
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Upload Service is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Environment: ${config.env}`);
  console.log(`Storage provider: ${config.upload.useS3 ? 'AWS S3' : config.upload.useMinIO ? 'MinIO' : 'Local'}`);
});