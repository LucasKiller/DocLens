import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface OcrExtract {
  text: string;
  language?: string;
  confidence?: number;
}

export interface IOcrProvider {
  extract(filePath: string): Promise<OcrExtract>;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  constructor(
    private prisma: PrismaService,
    @Inject('OCR_PROVIDER') private provider: IOcrProvider,
  ) {}

  async processDocument(docId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return;

    await this.prisma.document.update({
      where: { id: docId },
      data: { status: 'PROCESSING', error: null },
    });

    try {
      const { text, language, confidence } = await this.provider.extract(doc.storagePath);

      await this.prisma.$transaction([
        this.prisma.ocrResult.upsert({
          where: { docId },
          update: { text, language, confidence },
          create: { docId, text, language, confidence },
        }),
        this.prisma.document.update({
          where: { id: docId },
          data: { status: 'DONE', processedAt: new Date() },
        }),
      ]);
    } catch (e: any) {
      this.logger.error(`OCR failed for ${docId}`, e?.stack || e);
      await this.prisma.document.update({
        where: { id: docId },
        data: { status: 'FAILED', error: String(e?.message ?? e) },
      });
    }
  }
}
