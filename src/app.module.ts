/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { ConfigModule } from '@nestjs/config';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { PayuModule } from './payu/payu.module';
import { OrdersModule } from './orders/orders.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true, // so process.env works everywhere
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_URL,
      port: 3306,
      username: process.env.MYSQL_USER_NAME,
      password: process.env.MYSQL_USER_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    FormsModule,   // <-- ONLY import module

    PayuModule,
    SubscriptionsModule,
    PlansModule,
    OrdersModule,
  ],

  controllers: [AppController],
  providers: [AppService, {
    provide: APP_FILTER,
    useClass: GlobalExceptionFilter,
  }],
})
export class AppModule { }
