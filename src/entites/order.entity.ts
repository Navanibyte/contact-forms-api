/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id', unique: true })
  order_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'product_info', nullable: true })
  product_info: string;

  @Column({ name: 'customer_name', nullable: true })
  customer_name: string;

  @Column({ name: 'customer_email', nullable: true })
  customer_email: string;

  @Column({ default: 'PENDING' })
  status: string;
}
