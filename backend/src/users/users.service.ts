import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserDto, allowRole = false) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: allowRole && dto.role ? dto.role : undefined,
      },
    });

    return sanitizeUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return users.map(sanitizeUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto, allowRole = false) {
    const data: any = {};

    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }


    if (dto.role !== undefined && !allowRole) {
      throw new ForbiddenException('Alterar role requer perfil ADMIN');
    }
    if (dto.role !== undefined && allowRole) {
      data.role = dto.role;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return sanitizeUser(user);
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
