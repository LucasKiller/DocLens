// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS configurado para aceitar requisições do frontend
  app.enableCors({
    origin: [process.env.FRONTEND],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Swagger só em não-produção
  if (process.env.NODE_ENV !== 'PROD') {
    const cfg = new DocumentBuilder()
      .setTitle('DocLens API')
      .setDescription('Documentação dos endpoints de Autenticação e Usuários')
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .build();

    const doc = SwaggerModule.createDocument(app, cfg);
    // UI em /docs e JSON em /docs-json
    SwaggerModule.setup('docs', app, doc, { jsonDocumentUrl: 'docs-json' });
    // Exporta um arquivo local (útil para Postman/Insomnia)
    writeFileSync('./openapi.json', JSON.stringify(doc, null, 2));
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
