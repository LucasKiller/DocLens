import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // garante que onModuleDestroy() seja chamado em SIGINT/SIGTERM, etc.
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();
