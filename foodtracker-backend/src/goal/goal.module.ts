import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Goal } from './entities/goal.entity';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';


@Module({
  imports: [TypeOrmModule.forFeature([Goal])],
  providers: [GoalService],
  controllers: [GoalController],
})
export class GoalModule {}
