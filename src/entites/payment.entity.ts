/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  txnid: string;

  @Column({ nullable: true })
  mihpayid: string;

  @Column({ nullable: true, name: 'order_id' })
  order_id: string;

  @Column({ nullable: true })
  status: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ nullable: true })
  mode: string;

  @Column({ nullable: true, name: 'bank_ref_num' })
  bank_ref_num: string;

  @Column('longtext', { nullable: true, name: 'payment_hash' })
  payment_hash: string;

  @Column('longtext', { nullable: true, name: 'raw_response' })
  raw_response: string;
}
