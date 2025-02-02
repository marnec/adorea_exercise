import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { Document } from '@prisma/client'

@Injectable()
export class DocumentsRepository {
  logger = new Logger(DocumentsRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async getList(): Promise<Document[]> {
    this.logger.debug(`Fetching all documents`);

    return this.prisma.document.findMany();
  }

  async get(id: string): Promise<Document> {
    this.logger.debug(`Fetching document="${id}"`);

    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    this.logger.debug(`Creating new document with title="${data.title}"`);

    return this.prisma.document.create({
      data,
    });
  }

  async update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    this.logger.debug(`Updating document="${id}" with title="${data.title}"`);

    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Document> {
    this.logger.debug(`Deleting document="${id}"`);

    return this.prisma.document.delete({
      where: { id },
    });
  }
}
