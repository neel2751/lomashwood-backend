import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomersModule } from './customers/customers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SupportModule } from './support/support.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { SavedDesignsModule } from './saved-designs/saved-designs.module';
import { ConfigurationModule } from './config/configuration';

@Module({
  imports: [
    ConfigurationModule,
    CustomersModule,
    ReviewsModule,
    SupportModule,
    LoyaltyModule,
    WishlistModule,
    SavedDesignsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
