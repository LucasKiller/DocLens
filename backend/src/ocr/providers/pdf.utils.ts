import pdf from 'pdf-parse';
import { promises as fsp } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs-extra';

const execFileAsync = promisify(execFile);

export async function extractPdfText(filePath: string): Promise<string> {
  const buf = await fsp.readFile(filePath);
  const data = await pdf(buf);
  return (data.text || '').trim();
}

export async function rasterizePdfToImages(
  filePath: string,
  dpi = 300,
): Promise<{ outDir: string; images: string[] }> {
  const outDir = await fsp.mkdtemp(join(tmpdir(), 'pdf-pages-'));
  const prefix = join(outDir, 'page');

  const pdftoppm = process.env.PDFTOPPM_PATH || 'pdftoppm';
  // Gera page-1.png, page-2.png, ...
  await execFileAsync(pdftoppm, ['-png', '-r', String(dpi), filePath, prefix]);

  const files = await fsp.readdir(outDir);
  const images = files
    .filter((f) => f.endsWith('.png'))
    .map((f) => join(outDir, f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return { outDir, images };
}

export async function cleanupDir(dir: string) {
  await fs.remove(dir);
}