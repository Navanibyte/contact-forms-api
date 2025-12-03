/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class PayuService {
  private key = process.env.PAYU_API_KEY;
  private salt = process.env.PAYU_SALT;
  private payuUrl = process.env.PAYU_URL;

//   generateHash(body: any) {
//     // const hashString = [
//     //   this.key,
//     //   txnid,
//     //   amount,
//     //   productinfo,
//     //   firstname,
//     //   email,
//     //   '', '', '', '', '', '', '',
//     //   this.salt
//     // ].join('|');

//     // return crypto.createHash('sha512').update(hashString).digest('hex');

//     const {
//     key,
//     txnid,
//     amount,
//     productinfo,
//     firstname,
//     email,
//     phone
//   } = body;

//   const salt = process.env.PAYU_SALT;

//   const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${phone}|||||||||||${salt}`;

//   const hash = crypto.createHash('sha512').update(hashString).digest('hex');
//   return hash;

//   }


generateHash(data: any) {
  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
  } = data;

  const key = process.env.PAYU_API_KEY;
  const salt = process.env.PAYU_SALT;

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;

  return crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex');
}

  verifyResponseHash(body: any) {
    const { status, txnid, amount, productinfo, firstname, email, hash: returnedHash, additionalCharges } = body;
    let hashString = '';
    if (additionalCharges) {
      hashString = additionalCharges + '|' + this.salt + '|' + status + '||||||||||' + email + '|' + firstname + '|' + productinfo + '|' + amount + '|' + txnid + '|' + this.key;
    } else {
      hashString = this.salt + '|' + status + '||||||||||' + email + '|' + firstname + '|' + productinfo + '|' + amount + '|' + txnid + '|' + this.key;
    }
    const calculated = crypto.createHash('sha512').update(hashString).digest('hex');
    return { valid: calculated === returnedHash, calculated, returnedHash };
  }

  getPayuUrl() {
    return this.payuUrl;
  }
}
