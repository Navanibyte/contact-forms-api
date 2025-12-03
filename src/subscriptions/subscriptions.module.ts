/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../entites/subscription.entity';
import { Plan } from '../entites/plan.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Plan])  // ✅ Fix here
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
