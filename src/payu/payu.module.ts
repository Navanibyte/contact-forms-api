/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PayuController } from './payu.controller';
import { PayuService } from './payu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entites/order.entity';
import { Payment } from '../entites/payment.entity';
import { Subscription } from '../entites/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Payment, Subscription])],
  controllers: [PayuController],
  providers: [PayuService],
})
export class PayuModule {}
