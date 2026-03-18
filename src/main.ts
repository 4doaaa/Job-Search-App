import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, 
      max: 100, 
      message: 'Too many requests, please try again later.',
    }),
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();