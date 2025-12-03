/* eslint-disable prettier/prettier */
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entites/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(@InjectRepository(Order) private repo: Repository<Order>) {}

  @Get(':orderId')
  async getByOrder(@Param('orderId') orderId: string) {
    return this.repo.findOne({ where: { order_id: orderId } });
  }
}
