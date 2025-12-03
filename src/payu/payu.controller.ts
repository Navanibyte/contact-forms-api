/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Res } from '@nestjs/common';
import { PayuService } from './payu.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entites/order.entity';
import { Payment } from '../entites/payment.entity';
import { Subscription } from '../entites/subscription.entity';
import * as dotenv from 'dotenv';
dotenv.config();

@Controller('payu')
export class PayuController {
  constructor(
    private readonly payuService: PayuService,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
  ) {}

  // Initiate payment (for subscriptions or manual orders)
//   @Post('initiate')
//   async initiate(@Body() body: any) {
//     // body expects: txnid, amount, productinfo, firstname, email (txnid may be order_id)
//     const { txnid, amount, productinfo, firstname, email } = body;

//     // create an order record if not exists
//     await this.orderRepo.save({
//       order_id: txnid,
//       amount,
//       product_info: productinfo,
//       customer_name: firstname,
//       customer_email: email,
//       status: 'PENDING',
//     });

//     const hash = this.payuService.generateHash({ txnid, amount, productinfo, firstname, email });
//     return {
//       key: process.env.PAYU_API_KEY,
//       txnid,
//       amount,
//       productinfo,
//       firstname,
//       email,
//       surl: process.env.FRONTEND_URL + '/payu-success', // PayU will redirect here (we route via backend notify below)
//       furl: process.env.FRONTEND_URL + '/payu-failure',
//       hash,
//       payu_url: this.payuService.getPayuUrl(),
//     };
//   }

@Post('initiate')
async initiate(@Body() body: any) {
    console.log('Initiate payment body:', body);
  const { txnid, amount, productinfo, firstname, email, phone } = body;

  // Save order
  await this.orderRepo.save({
    order_id: txnid,
    amount,
    product_info: productinfo,
    customer_name: firstname,
    customer_email: email,
    customer_phone: phone, // ✔ save phone
    status: 'PENDING',
  });

  // Generate hash
  const hash = this.payuService.generateHash({
    txnid,
    amount,
    productinfo,
    firstname,
    email
  });

  return {
    key: process.env.PAYU_API_KEY,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,                                  // ✔ MUST SEND TO PAYU
    surl: process.env.FRONTEND_URL + '/payu-success',
    furl: process.env.FRONTEND_URL + '/payu-failure',
    hash,
    payu_url: this.payuService.getPayuUrl(),
  };
}

  // PayU redirects here (configure in merchant dashboard or send as surl/furl). We expect a POST from PayU.
  @Post('callback')
  async callback(@Body() body: any, @Res() res: any) {
    // Save payment
    await this.paymentRepo.save({
      txnid: body.txnid,
      mihpayid: body.mihpayid,
      order_id: body.txnid,
      status: body.status,
      amount: body.amount,
      mode: body.mode,
      bank_ref_num: body.bank_ref_num,
      payment_hash: body.hash,
      raw_response: JSON.stringify(body),
    });

    // verify and update order
    const { valid } = this.payuService.verifyResponseHash(body);
    await this.orderRepo.update({ order_id: body.txnid }, { status: body.status });

    // If this was a subscription order, update subscription record
    await this.subRepo.update({ order_id: body.txnid }, {
      payment_status: body.status === 'success' ? 'ACTIVE' : 'FAILED',
      // optionally set start_date/end_date here
    });

    // Redirect user to frontend pages (we send a small HTML page to redirect)
    const frontBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectTo = body.status === 'success' ? `${frontBase}/success?order_id=${body.txnid}` : `${frontBase}/failure?order_id=${body.txnid}`;
    res.send(`<html><body><script>window.location='${redirectTo}';</script></body></html>`);
  }
}
