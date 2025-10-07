import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleValues } from './role.enum';
import type { RoleDto } from './role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(RoleValues)
  role?: RoleDto; // só admin deverá poder setar
}
