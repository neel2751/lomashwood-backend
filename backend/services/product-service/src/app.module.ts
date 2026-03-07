import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './products/categories/categories.module';
import { ColoursModule } from './products/colours/colours.module';
import { SizesModule } from './products/sizes/sizes.module';
import { InventoryModule } from './products/inventory/inventory.module';
import { PricingModule } from './products/pricing/pricing.module';
import { ConfigurationModule } from './products/config/configuration';

@Module({
  imports: [
    ConfigurationModule,
    ProductsModule,
    CategoriesModule,
    ColoursModule,
    SizesModule,
    InventoryModule,
    PricingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
