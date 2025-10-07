import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private users: UsersService,
  ) {}

  // Registro público (ROLE sempre USER aqui)
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const created = await this.users.create({ ...dto, role: undefined }, false);
    return this.auth.signToken({ id: created.id, email: created.email, role: 'USER' as any });
  }

  // Login (passa pela LocalStrategy)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Body() _dto: LoginDto, @Req() req: any) {
    // req.user vem da LocalStrategy.validate
    return this.auth.signToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });
  }

  // Perfil do usuário logado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
