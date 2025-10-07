import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Auth + Users (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let prisma: PrismaClient;

  // Helpers
  const asBearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // Use DATABASE_URL_TEST se existir; senão, cai no DATABASE_URL normal
    if (process.env.DATABASE_URL_TEST) {
      process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
    }

    prisma = new PrismaClient();
    // Garante que a conexão está ok
    await prisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    // Limpa a base antes de cada teste (ajuste se tiver mais tabelas)
    // Para Postgres:
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('Fluxo completo: register → promote ADMIN → login → CRUD users', async () => {
    // 1) Register cria um USER e retorna token
    const registerRes = await request(httpServer)
      .post('/auth/register')
      .send({ email: 'admin@doclens.local', name: 'Admin', password: 'Admin123!' })
      .expect(201);

    expect(registerRes.body).toHaveProperty('access_token');
    const initialToken = registerRes.body.access_token as string;

    // 2) Promove esse usuário para ADMIN diretamente no banco (seed rápido para teste)
    await prisma.user.update({
      where: { email: 'admin@doclens.local' },
      data: { role: 'ADMIN' },
    });

    // 3) Login como ADMIN para obter um token "limpo"
    const loginRes = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'admin@doclens.local', password: 'Admin123!' })
      .expect(201)
      .catch(async (e) => {
        const alt = await request(httpServer)
          .post('/auth/login')
          .send({ email: 'admin@doclens.local', password: 'Admin123!' })
          .expect(200);
        return alt;
      });

    expect(loginRes.body).toHaveProperty('access_token');
    const adminToken = loginRes.body.access_token as string;

    // 4) /auth/me com token de admin
    const meRes = await request(httpServer)
      .get('/auth/me')
      .set(asBearer(adminToken))
      .expect(200);

    expect(meRes.body).toMatchObject({
      email: 'admin@doclens.local',
      role: 'ADMIN',
    });

    // 5) ADMIN cria um outro usuário já como USER
    const createUserRes = await request(httpServer)
      .post('/users')
      .set(asBearer(adminToken))
      .send({ email: 'user@teste.com', name: 'User Teste', password: 'Senha123!', role: 'USER' })
      .expect(201);

    expect(createUserRes.body).toMatchObject({
      email: 'user@teste.com',
      name: 'User Teste',
      role: 'USER',
    });
    expect(createUserRes.body).toHaveProperty('id');
    const userId = createUserRes.body.id as string; // UUID

    // 6) ADMIN lista usuários
    const listRes = await request(httpServer)
      .get('/users')
      .set(asBearer(adminToken))
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(2); // admin + user

    // 7) ADMIN consulta o user criado
    const getRes = await request(httpServer)
      .get(`/users/${userId}`)
      .set(asBearer(adminToken))
      .expect(200);

    expect(getRes.body).toMatchObject({
      id: userId,
      email: 'user@teste.com',
      role: 'USER',
    });

    // 8) USER faz login e testa as permissões
    const userLoginRes = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'user@teste.com', password: 'Senha123!' })
      .expect(200);

    const userToken = userLoginRes.body.access_token as string;

    // USER pode ver a si mesmo
    await request(httpServer)
      .get(`/users/${userId}`)
      .set(asBearer(userToken))
      .expect(200);

    // USER NÃO pode mudar a própria role para ADMIN
    await request(httpServer)
      .patch(`/users/${userId}`)
      .set(asBearer(userToken))
      .send({ role: 'ADMIN' })
      .expect(403);

    // USER pode atualizar o próprio nome/senha
    const patchSelf = await request(httpServer)
      .patch(`/users/${userId}`)
      .set(asBearer(userToken))
      .send({ name: 'User Renomeado' })
      .expect(200);

    expect(patchSelf.body).toMatchObject({
      id: userId,
      name: 'User Renomeado',
    });

    // 9) ADMIN pode promover esse usuário a ADMIN
    const promoteRes = await request(httpServer)
      .patch(`/users/${userId}`)
      .set(asBearer(adminToken))
      .send({ role: 'ADMIN' })
      .expect(200);

    expect(promoteRes.body.role).toBe('ADMIN');

    // 10) ADMIN pode deletar o usuário
    const delRes = await request(httpServer)
      .delete(`/users/${userId}`)
      .set(asBearer(adminToken))
      .expect(200);

    expect(delRes.body).toEqual({ success: true });

    // 11) Após deletar, /users/:id retorna 404
    await request(httpServer)
      .get(`/users/${userId}`)
      .set(asBearer(adminToken))
      .expect(404);
  });

  it('Proteção por JWT: /auth/me sem token → 401', async () => {
    await request(httpServer).get('/auth/me').expect(401);
  });

  it('Validação DTO: register com senha curta → 400', async () => {
    await request(httpServer)
      .post('/auth/register')
      .send({ email: 'x@x.com', name: 'X', password: '123' })
      .expect(400);
  });
});
