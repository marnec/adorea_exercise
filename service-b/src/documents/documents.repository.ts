import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaErrorCodes } from 'src/constants';
import { ImportedDocumentDto } from 'src/serviceA/dto/imported-document.dto';
import { PrismaService } from '../prisma.service';
import { Document } from '@prisma/client';
import { CreateManyResult } from './dto/create-many-result.dto';

@Injectable()
export class DocumentsRepository {
  logger = new Logger(DocumentsRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(refKey: string, title: string): Promise<Document | null> {
    return this.prisma.document
      .create({
        data: { refKey, title },
      })
      .catch((err) => {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === PrismaErrorCodes.UNIQUE_CONSTRAINT_FAIL
        ) {
          this.logger.warn(`Duplicate import of remote document="${refKey}". Skipping`);
          return null
        }
      });
  }

  async createMany(documents: ImportedDocumentDto[]): Promise<CreateManyResult> {
    return this.prisma.document.createMany({ data: documents, skipDuplicates: true }).then(({ count }) => ({
      count,
      skipped: documents.length - count,
    }));
  }
}
