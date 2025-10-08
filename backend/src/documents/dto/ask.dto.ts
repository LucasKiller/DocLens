import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AskDto {
  @ApiProperty({ example: 'Quais são os valores totais e a data?' })
  @IsString()
  @MinLength(3)
  question: string;
}
