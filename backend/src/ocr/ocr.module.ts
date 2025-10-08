import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrTesseractProvider } from './providers/ocr.tesseract';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    OcrService,
    { provide: 'OCR_PROVIDER', useClass: OcrTesseractProvider },
  ],
  exports: [OcrService],
})
export class OcrModule {}
