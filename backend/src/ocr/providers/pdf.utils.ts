import pdf from 'pdf-parse';
import { promises as fsp, createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execa } from 'execa';
import fs from 'fs-extra';

export async function extractPdfText(filePath: string): Promise<string> {
    // pdf-parse aceita Buffer/Uint8Array
    const buf = await fsp.readFile(filePath);
    const data = await pdf(buf);
    return (data.text || '').trim();
}

/**
 * Converte todas as páginas do PDF em PNGs usando pdftoppm.
 * Retorna o diretório temporário + lista de imagens criadas.
 */
export async function rasterizePdfToImages(
    filePath: string,
    dpi = 300,
): Promise<{ outDir: string; images: string[] }> {
    const outDir = await fsp.mkdtemp(join(tmpdir(), 'pdf-pages-'));
    const prefix = join(outDir, 'page');

    const pdftoppm = process.env.PDFTOPPM_PATH || 'pdftoppm';
    // Gera page-1.png, page-2.png, ...
    await execa(pdftoppm, ['-png', '-r', String(dpi), filePath, prefix]);

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
