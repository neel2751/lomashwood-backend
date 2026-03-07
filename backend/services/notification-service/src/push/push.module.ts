import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { PushLog } from './entities/push-log.entity';
import { FirebaseProvider } from './providers/firebase.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushLog]),
    BullModule.registerQueue({
      name: 'push',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
    ConfigModule,
  ],
  controllers: [PushController],
  providers: [
    PushService,
    FirebaseProvider,
  ],
  exports: [PushService],
})
export class PushModule {}
