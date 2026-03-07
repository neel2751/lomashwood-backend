import { AppModule } from './app.module';
import { config } from './config/configuration';

async function bootstrap() {
  try {
    const app = new AppModule();
    const server = app.getApp();

    server.listen(config.port, () => {
      console.log(`🚀 API Gateway is running on port ${config.port}`);
      console.log(`📊 Health check available at http://localhost:${config.port}/health`);
      console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Log service URLs
      console.log('\n📡 Service URLs:');
      Object.entries(config.services).forEach(([name, url]) => {
        console.log(`  ${name}: ${url}`);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

bootstrap();
