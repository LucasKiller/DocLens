import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Criar usuário (admin criando outros usuários, permitindo role)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto, true);
  }

  // Listar todos (ADMIN)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Ver 1 usuário: ADMIN ou o próprio dono
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const isSelf = req.user.userId === id;
    if (!isSelf && req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.usersService.findOne(id);
  }

  // Atualizar: ADMIN pode tudo; USER só pode atualizar próprio nome/senha
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @Req() req: any) {
    const isSelf = req.user.userId === id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isSelf && !isAdmin) throw new ForbiddenException();

    // apenas ADMIN pode alterar role
    const allowRole = isAdmin;
    return this.usersService.update(id, dto, allowRole);
  }

  // Remover: apenas ADMIN
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
