import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

function getCorsOrigins(): string[] {
  const corsOrigins = process.env.CORS_ORIGINS;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!corsOrigins || corsOrigins.trim().length === 0) {
    if (isProduction) {
      throw new Error(
        'CORS_ORIGINS environment variable must be set in production. ' +
        'Example: CORS_ORIGINS=https://app.example.com,https://www.example.com'
      );
    }

    // Development fallback to specific localhost origins
    console.warn(
      '⚠️  CORS_ORIGINS not set. Using development defaults: ' +
      'http://localhost:3000, http://localhost:3001, http://localhost:8081, http://192.168.1.4:8081'
    );
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'http://192.168.1.4:8081',
    ];
  }

  return corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = getCorsOrigins();

  app.use(json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
