import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { RefundsModule } from './refunds/refunds.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ConfigurationModule } from './config/configuration';

@Module({
  imports: [
    ConfigurationModule,
    OrdersModule,
    PaymentsModule,
    InvoicesModule,
    RefundsModule,
    WebhooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
