import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleValues } from './role.enum';
import type { RoleDto } from './role.enum';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ example: 'user@teste.com' })
  email: string;

  @ApiProperty({ example: 'Usuário' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Senha123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Object.keys(RoleValues), example: 'USER' })
  @IsOptional()
  @IsEnum(RoleValues)
  role?: RoleDto; // só admin deverá poder setar
}
