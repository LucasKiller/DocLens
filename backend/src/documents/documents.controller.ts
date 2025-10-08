import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Query, Res, ParseUUIDPipe, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { DocumentsService } from './documents.service';
import { AskDto } from './dto/ask.dto';
import type { Response, Express, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags, ApiOperation } from '@nestjs/swagger';

const allowed = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'
]);

function filenameGenerator(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
): void {
  const name = uuidv4().replace(/-/g, '');
  callback(null, `${name}${extname(file.originalname)}`);
}

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

  @ApiOperation({ summary: 'Upload de imagem para OCR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req: Request, _file: Express.Multer.File, cb) => {
        cb(null, process.env.UPLOAD_DIR || './uploads');
      },
      filename: filenameGenerator,
    }),
    fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
      if (!allowed.has(file.mimetype)) {
        return cb(new BadRequestException('Formato não suportado') as unknown as Error, false);
      }
      cb(null, true);
    },
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  }))
  @Post()
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() _body: any,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    return this.docs.createFromUpload(file, (req as any).user.userId);
  }

  @ApiOperation({ summary: 'Listar documentos do usuário (ADMIN pode filtrar)' })
  @Get()
  list(@Query('userId') userId: string | undefined, @Req() req: Request) {
    return this.docs.listForUser((req as any).user, userId);
  }

  @ApiOperation({ summary: 'Detalhe do documento (inclui OCR quando pronto)' })
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.docs.getDetail(id, (req as any).user);
  }

  @ApiOperation({ summary: 'Status do OCR' })
  @Get(':id/status')
  status(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.docs.getStatus(id, (req as any).user);
  }

  @ApiOperation({ summary: 'Perguntar ao LLM sobre o documento (usa texto do OCR)' })
  @Post(':id/ask')
  ask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AskDto, @Req() req: Request) {
    return this.docs.ask(id, (req as any).user, dto.question);
  }

  @ApiOperation({ summary: 'Download do pacote (texto OCR + interações)' })
  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const content = await this.docs.download(id, (req as any).user);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="document-${id}.txt"`);
    res.send(content);
  }
}
