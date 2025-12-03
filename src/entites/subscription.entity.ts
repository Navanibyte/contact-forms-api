/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ name: 'plan_id' })
  plan_id: number;

  @Column({ name: 'order_id', nullable: true })
  order_id: string;

  @Column({ name: 'payment_status', default: 'PENDING' })
  payment_status: string;

  @Column({ name: 'start_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_date: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  end_date: Date;
}
