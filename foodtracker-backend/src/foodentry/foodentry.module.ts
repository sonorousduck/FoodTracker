import { Module } from '@nestjs/common';
import { FoodentryService } from './foodentry.service';
import { FoodentryController } from './foodentry.controller';

@Module({
  providers: [FoodentryService],
  controllers: [FoodentryController]
})
export class FoodentryModule {}
