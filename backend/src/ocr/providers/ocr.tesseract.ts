import { IOcrProvider, OcrExtract } from '../ocr.service';
import { createWorker } from 'tesseract.js';
import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import { extractPdfText, rasterizePdfToImages, cleanupDir } from './pdf.utils';

@Injectable()
export class OcrTesseractProvider implements IOcrProvider {
  async extract(filePath: string): Promise<OcrExtract> {
    const langs = process.env.OCR_LANGS;
    const isPdf = extname(filePath).toLowerCase() === '.pdf';

    if (isPdf) {
      const text = await extractPdfText(filePath);
      if (text && text.replace(/\s+/g, '').length > 50) {
        return { text, language: 'pdf-text', confidence: undefined };
      }
      const { outDir, images } = await rasterizePdfToImages(filePath, 300);
      try {
        const worker = await createWorker(langs);
        let full = '';
        for (const img of images) {
          const { data } = await worker.recognize(img);
          full += (data?.text ?? '') + '\n';
        }
        await worker.terminate();
        return { text: full.trim(), language: langs, confidence: undefined };
      } finally {
        await cleanupDir(outDir);
      }
    }

    const worker = await createWorker(langs);
    try {
      const { data } = await worker.recognize(filePath);
      const text = data?.text ?? '';
      const confidence = (data as any)?.confidence as number | undefined;
      return { text, language: langs, confidence };
    } finally {
      await worker.terminate();
    }
  }
}
