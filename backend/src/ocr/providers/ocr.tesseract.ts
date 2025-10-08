import { IOcrProvider, OcrExtract } from '../ocr.service';
import { createWorker } from 'tesseract.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OcrTesseractProvider implements IOcrProvider {
  async extract(filePath: string): Promise<OcrExtract> {
    const langs = process.env.OCR_LANGS;
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
