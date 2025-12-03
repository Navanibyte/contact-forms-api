/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../entites/plan.entity';
import { PlansController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  controllers: [PlansController],
})
export class PlansModule {}
