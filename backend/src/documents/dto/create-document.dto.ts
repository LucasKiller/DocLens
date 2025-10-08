import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty() filename: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
}
