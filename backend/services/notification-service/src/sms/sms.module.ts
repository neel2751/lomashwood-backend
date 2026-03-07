import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SmsLog } from './entities/sms-log.entity';
import { TwilioProvider } from './providers/twilio.provider';
import { Msg91Provider } from './providers/msg91.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsLog]),
    BullModule.registerQueue({
      name: 'sms',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
    ConfigModule,
  ],
  controllers: [SmsController],
  providers: [
    SmsService,
    TwilioProvider,
    Msg91Provider,
  ],
  exports: [SmsService],
})
export class SmsModule {}
