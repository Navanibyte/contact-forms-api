/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body, Get, Request, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entites/subscription.entity';
import { Plan } from '../entites/plan.entity';
import { AuthGuard } from 'src/auth/guards/auth.guard';

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


@UseGuards(AuthGuard)
@Get('is-subscribed')
async isSubscribed( @Request() request: any) {
  const user_id = request.user.userId;
  console.log("user_id::::", user_id);
  if (!user_id) {
    return { error: 'user_id is required' };
  }

  // Get latest subscription of this user
  const latest = await this.subRepo.findOne({
    where: { user_id },
    order: { id: 'DESC' },
  });

  if (!latest) {
    return {
      subscribed: false,
      message: 'No subscription found',
    };
  }

  // Check active
  const isActive = latest.payment_status === 'ACTIVE';

  return {
    subscribed: isActive,
    payment_status: latest.payment_status,
    order_id: latest.order_id,
    plan_id: latest.plan_id,
  };
}
}
