import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

class TokenResponse {
  access_token: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private users: UsersService,
  ) {}

  @ApiOperation({ summary: 'Registrar usuário (retorna token JWT)' })
  @ApiCreatedResponse({ type: TokenResponse })
  // Registro público (ROLE sempre USER aqui)
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const created = await this.users.create({ ...dto, role: undefined }, false);
    return this.auth.signToken({ id: created.id, email: created.email, name: created.name, role: 'USER' as any });
  }

  @ApiOperation({ summary: 'Login (retorna token JWT)' })
  @ApiOkResponse({ type: TokenResponse })
  @ApiBody({ type: LoginDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  // Login (passa pela LocalStrategy)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Body() _dto: LoginDto, @Req() req: any) {
    // req.user vem da LocalStrategy.validate
    return this.auth.signToken({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    });
  }

  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    schema: {
      properties: {
        userId: { type: 'string', format: 'uuid', example: '6e7a0b3d-5a55-4d0e-9f2b-3e0e3b2b7b9a' },
        name: { type: 'string', example: 'Lucas Galhardo' },
        email: { type: 'string', example: 'admin@doclens.com' },
        role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' },
      },
    },
  })
  // Perfil do usuário logado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
