import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const rateLimit = this.reflector.get<number>('rateLimit', context.getHandler()) || 100;
    const rateWindow = this.reflector.get<number>('rateWindow', context.getHandler()) || 60000;

    const clientIp = request.ip || request.connection.remoteAddress;
    const currentTime = Date.now();
    
    if (!request._rateLimitData) {
      request._rateLimitData = {};
    }

    const userRequests = request._rateLimitData[clientIp] || [];
    const recentRequests = userRequests.filter(time => currentTime - time < rateWindow);

    if (recentRequests.length >= rateLimit) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    recentRequests.push(currentTime);
    request._rateLimitData[clientIp] = recentRequests;

    return true;
  }
}
