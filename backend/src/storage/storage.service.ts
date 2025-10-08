import { Injectable } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

@Injectable()
export class StorageService {
  ensureDir(filePath: string) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  getReadStream(path: string) {
    return createReadStream(path);
  }

  resolve(...parts: string[]) {
    return join(process.cwd(), ...parts);
  }
}
