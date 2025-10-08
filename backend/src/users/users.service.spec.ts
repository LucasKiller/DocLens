import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // limpa chamadas entre testes
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Exemplo de teste real (ajuste aos métodos que você tem):
  it('create deve retornar usuário sem passwordHash', async () => {
    (prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 'uuid-1',
      email: 'a@a.com',
      name: 'A',
      role: 'USER',
      passwordHash: '***',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create(
      { email: 'a@a.com', name: 'A', password: 'Senha123!' } as any,
      true, // allowRole (se seu create aceitar)
    );

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'uuid-1',
      email: 'a@a.com',
      name: 'A',
      role: 'USER',
    });
    expect((result as any).passwordHash).toBeUndefined();
  });
});
