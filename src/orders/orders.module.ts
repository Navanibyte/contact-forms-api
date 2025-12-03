/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entites/order.entity';
import { Payment } from '../entites/payment.entity';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Payment])],
  controllers: [OrdersController],
})
export class OrdersModule {}
