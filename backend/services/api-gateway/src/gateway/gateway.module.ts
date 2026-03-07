import { Module } from '@nestjs/common';
import { proxyMiddleware } from './proxy.middleware';
import {
  generalRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
  appointmentRateLimiter,
  contactRateLimiter,
} from './rate-limiter.middleware';

@Module({
  providers: [
    {
      provide: 'PROXY_MIDDLEWARE',
      useValue: proxyMiddleware,
    },
    {
      provide: 'GENERAL_RATE_LIMITER',
      useValue: generalRateLimiter,
    },
    {
      provide: 'AUTH_RATE_LIMITER',
      useValue: authRateLimiter,
    },
    {
      provide: 'PASSWORD_RESET_RATE_LIMITER',
      useValue: passwordResetRateLimiter,
    },
    {
      provide: 'UPLOAD_RATE_LIMITER',
      useValue: uploadRateLimiter,
    },
    {
      provide: 'APPOINTMENT_RATE_LIMITER',
      useValue: appointmentRateLimiter,
    },
    {
      provide: 'CONTACT_RATE_LIMITER',
      useValue: contactRateLimiter,
    },
  ],
  exports: [
    'PROXY_MIDDLEWARE',
    'GENERAL_RATE_LIMITER',
    'AUTH_RATE_LIMITER',
    'PASSWORD_RESET_RATE_LIMITER',
    'UPLOAD_RATE_LIMITER',
    'APPOINTMENT_RATE_LIMITER',
    'CONTACT_RATE_LIMITER',
  ],
})
export class GatewayModule {}