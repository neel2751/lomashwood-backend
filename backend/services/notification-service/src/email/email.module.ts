import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailLog } from './entities/email-log.entity';
import { SendgridProvider } from './providers/sendgrid.provider';
import { NodemailerProvider } from './providers/nodemailer.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog]),
    BullModule.registerQueue({
      name: 'emails',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
    ConfigModule,
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    SendgridProvider,
    NodemailerProvider,
  ],
  exports: [EmailService],
})
export class EmailModule {}
