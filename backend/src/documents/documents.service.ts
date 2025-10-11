import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OcrService } from '../ocr/ocr.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private ocr: OcrService,
    private llm: LlmService,
  ) {}

  private assertAccess(doc: { ownerId: string }, user: { userId: string; role: string }) {
    if (user.role !== 'ADMIN' && doc.ownerId !== user.userId) {
      throw new ForbiddenException('Sem acesso ao documento');
    }
  }

  async createFromUpload(file: Express.Multer.File, ownerId: string) {
    const doc = await this.prisma.document.create({
      data: {
        ownerId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
        status: 'QUEUED',
      },
    });

    // processa OCR "em background" (não espera)
    void this.ocr.processDocument(doc.id);
    return doc;
  }

  async listForUser(user: { userId: string; role: string }, ownerId?: string) {
    const where =
      user.role === 'ADMIN' && ownerId
        ? { ownerId }
        : user.role === 'ADMIN'
          ? {}
          : { ownerId: user.userId };

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, filename: true, mimeType: true, size: true,
        status: true, error: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async getDetail(docId: string, user: { userId: string; role: string }) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      include: { ocr: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    this.assertAccess(doc, user);
    return doc;
  }

  async getStatus(docId: string, user: { userId: string; role: string }) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    this.assertAccess(doc, user);
    return { status: doc.status, error: doc.error, processedAt: doc.processedAt };
  }

  async listInteractions(
    docId: string,
    user: { userId: string; role: string },
    opts: { take?: number; cursor?: string } = {},
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      select: { ownerId: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    this.assertAccess(doc, user);

    const take = Math.min(Math.max(opts.take ?? 100, 1), 500);
    const cursor = opts.cursor ? { id: opts.cursor } : undefined;

    const items = await this.prisma.llmInteraction.findMany({
      where: { docId },
      orderBy: { createdAt: 'asc' },
      ...(cursor ? { skip: 1, cursor } : {}),
      take,
      select: { id: true, question: true, answer: true, createdAt: true },
    });

    const nextCursor = items.length === take ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  async ask(docId: string, user: { userId: string; role: string }, question: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      include: { ocr: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    this.assertAccess(doc, user);

    if (doc.status !== 'DONE' || !doc.ocr) {
      throw new ForbiddenException('OCR ainda não concluído para este documento');
    }

    const answer = await this.llm.answer(question, doc.ocr.text);

    const interaction = await this.prisma.llmInteraction.create({
      data: { docId: doc.id, userId: user.userId, question, answer },
      select: { id: true, question: true, answer: true, createdAt: true },
    });

    return { answer, interaction };
  }

  async download(docId: string, user: { userId: string; role: string }) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      include: { ocr: true, interactions: { orderBy: { createdAt: 'asc' } } },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    this.assertAccess(doc, user);

    const parts: string[] = [];
    parts.push(`# Documento: ${doc.filename} (${doc.mimeType}, ${doc.size} bytes)`);
    parts.push(`Status: ${doc.status}${doc.error ? ` | erro: ${doc.error}` : ''}`);
    parts.push(`Processado em: ${doc.processedAt ?? '-'}\n`);
    parts.push(`## Texto OCR\n${doc.ocr?.text ?? '(sem OCR)'}\n`);
    parts.push(`## Interações LLM`);
    if (!doc.interactions.length) parts.push('(sem interações)');
    for (const it of doc.interactions) {
      parts.push(`- [${it.createdAt.toISOString()}] Q: ${it.question}`);
      parts.push(`  A: ${it.answer}`);
    }
    return parts.join('\n');
  }
}