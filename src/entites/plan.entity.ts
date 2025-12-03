/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'plans' })
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_name' })
  plan_name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;
}
