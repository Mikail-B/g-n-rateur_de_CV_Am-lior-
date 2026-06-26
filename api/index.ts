import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { AppModule } from '../src/app.module';

let cachedServer: ReturnType<typeof express> | null = null;

async function bootstrap() {
  if (cachedServer) {
    return cachedServer;
  }

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.enableCors();
  await app.init();
  cachedServer = server;

  return server;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await bootstrap();

  if (req.url?.startsWith('/api/')) {
    req.url = req.url.slice('/api'.length);
  }

  server(req, res);
}
