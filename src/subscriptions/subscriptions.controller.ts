/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entites/subscription.entity';
import { Plan } from '../entites/plan.entity';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(Plan) private planRepo: Repository<Plan>,
  ) {}

  @Post('create')
  async create(@Body() body: { user_id: number; plan_id: number }) {
    const plan = await this.planRepo.findOne({ where: { id: body.plan_id } });
    if (!plan) return { error: 'Plan not found' };

    const orderId = `SUB_${Date.now()}`;
    const sub = this.subRepo.create({
      user_id: body.user_id,
      plan_id: body.plan_id,
      order_id: orderId,
      payment_status: 'PENDING',
    });
    await this.subRepo.save(sub);

    return {
      order_id: orderId,
      amount: plan.price,
      productinfo: `${plan.plan_name} Subscription`,
    };
  }
}
