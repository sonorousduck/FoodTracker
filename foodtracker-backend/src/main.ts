import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://10.0.0.83:8081',
      'http://192.168.1.16:8081',
      'http://192.168.1.47:8081',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // If you need to send cookies
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
