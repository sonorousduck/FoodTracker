import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Weight } from './entities/weight.entity';
import { WeightController } from './weight.controller';
import { WeightService } from './weight.service';


@Module({
  imports: [TypeOrmModule.forFeature([Weight])],
  providers: [WeightService],
  controllers: [WeightController],
})
export class WeightModule {}
