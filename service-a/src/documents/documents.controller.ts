import { Controller, Get, Post, Param, Body, Delete, Put, UseGuards, Logger } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Document } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getList(): Promise<Document[]> {
    this.logger.log(`Requested all documents`);

    return this.documentsService.getList();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Document> {
    this.logger.log(`Requested document with id="${id}"`);

    return this.documentsService.get(id);
  }

  @Post()
  async create(@Body() data: Prisma.DocumentCreateInput): Promise<Document> {
    this.logger.log(`Requested creation of new document with title="${data.title}"`);

    return this.documentsService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.DocumentUpdateInput): Promise<Document> {
    this.logger.log(`Requested updated of document="${id}" with title="${data.title}"`);

    return this.documentsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Document> {
    this.logger.log(`Requested deletion of document="${id}"`);

    return this.documentsService.delete(id);
  }
}
