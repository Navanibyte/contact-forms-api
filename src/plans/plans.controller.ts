/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../entites/plan.entity';

@Controller('plans')
export class PlansController {
  constructor(@InjectRepository(Plan) private repo: Repository<Plan>) {}

  @Get()
  async list() {
    return this.repo.find();
  }
}
