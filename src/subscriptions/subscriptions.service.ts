/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Subscription } from "rxjs";
import { Plan } from "src/entites/plan.entity";
import { Repository } from "typeorm";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>  // ✅ Proper DI
  ) {}
}
