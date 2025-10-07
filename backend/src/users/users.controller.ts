import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { RoleValues } from './dto/role.enum';

class UserResponse {
  id: number;
  email: string;
  name: string;
  role: keyof typeof RoleValues;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Criar usuário (ADMIN)' })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'Email já cadastrado' })
  // Criar usuário (admin criando outros usuários, permitindo role)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto, true);
  }

  @ApiOperation({ summary: 'Listar usuários (ADMIN)' })
  @ApiOkResponse({ type: UserResponse, isArray: true })
  // Listar todos (ADMIN)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Buscar um usuário (ADMIN ou o próprio)' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  // Ver 1 usuário: ADMIN ou o próprio dono
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const isSelf = req.user.userId === id;
    if (!isSelf && req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar usuário (ADMIN qualquer / USER apenas o próprio, sem mudar role)' })
  @ApiOkResponse({ type: UserResponse })
  @ApiForbiddenResponse({ description: 'Sem permissão para alterar' })
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

  @ApiOperation({ summary: 'Excluir usuário (ADMIN)' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean', example: true } } } })
  // Remover: apenas ADMIN
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
