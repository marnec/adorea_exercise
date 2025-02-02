import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DocumentsRepository } from './documents.repository';
import { PrismaErrorCodes } from 'src/constants';
import { inspect } from 'util';
import { Document } from '@prisma/client';

@Injectable()
export class DocumentsService {
  logger = new Logger(DocumentsService.name);

  constructor(private readonly docsRepository: DocumentsRepository) {}

  async getList(): Promise<Document[]> {
    this.logger.log(`Fetching all documents`);

    return this.docsRepository.getList().catch((err) => {
      throw new InternalServerErrorException(
        `An unexpected problem occured while fetching all documents; original error: ${inspect(err)}`,
      );
    });
  }

  async get(id: string): Promise<Document> {
    this.logger.log(`Fetching document="${id}"`);

    return this.docsRepository
      .get(id)
      .then((document) => {
        if (!document) {
          throw new NotFoundException(`Document not found with id="${id}"`);
        }
        return document;
      })
      .catch((err) => {
        throw new InternalServerErrorException(
          `An unexpected problem occured while fetching document="${id}"; original error: ${inspect(err)}`,
        );
      });
  }

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    this.logger.log(`Creating new document with title="${data.title}"`);

    return this.docsRepository.create(data).catch((err) => {
      throw new InternalServerErrorException(
        `An unexpected problem occured while creating a new document; original error: ${inspect(err)}`,
      );
    });
  }

  async update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    this.logger.log(`Updating document="${id}" with title="${data.title}"`);

    return this.docsRepository.update(id, data).catch((err) => {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PrismaErrorCodes.OPEARATION_DEPENDS_ON_MISSING
      ) {
        throw new NotFoundException(`Document not found with id="${id}"`);
      }
      throw new InternalServerErrorException(
        `An unexpected problem occured while updating document="${id}"; original error: ${inspect(err)}`,
      );
    });
  }

  async delete(id: string): Promise<Document> {
    this.logger.log(`Deleting document="${id}"`);

    return this.docsRepository.delete(id).catch((err) => {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PrismaErrorCodes.OPEARATION_DEPENDS_ON_MISSING
      ) {
        throw new NotFoundException(`Document not found with id="${id}"`);
      }
      throw new InternalServerErrorException(
        `An unexpected problem occured while deleting document="${id}"; original error: ${inspect(err)}`,
      );
    });
  }
}
