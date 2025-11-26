/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/http-exception.filter';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.enableCors({
//     origin: (origin, callback) => {
//       const allowedOrigins = [
//         'http://localhost:3000',
//         'http://localhost:5173',
//         'http://127.0.0.1:3000',
//         'https://formbuilder.impelox.com',
//         'https://www.formbuilder.impelox.com'
//       ];
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
//     credentials: true,
//     allowedHeaders: 'Content-Type,Authorization',
//     exposedHeaders: 'Authorization',
//   });

//   app.useGlobalPipes(new ValidationPipe());
//   await app.listen(process.env.PORT ?? 8000);
// }
// bootstrap();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'https://formbuilder.impelox.com',
      'https://www.formbuilder.impelox.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

   // Register global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
