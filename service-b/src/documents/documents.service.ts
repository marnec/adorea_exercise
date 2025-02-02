import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ServiceAAuthDto } from 'src/serviceA/service-a-auth.dto';
import { inspect } from 'util';
import { ServiceAClient } from '../serviceA/service-a.client';
import { DocumentsRepository } from './documents.repository';
import { CreateManyResult } from './dto/create-many-result.dto';
import { EditRemoteDocumentDto } from './dto/edit-remote-document.dto';
import { Document } from '@prisma/client';
import { RemoteDocumentDto } from 'src/serviceA/dto/remote-document.dto';

@Injectable()
export class DocumentsSyncService {
  private readonly logger = new Logger(DocumentsSyncService.name);

  constructor(
    private documentsRepository: DocumentsRepository,
    private documentsClient: ServiceAClient,
  ) {}

  async importAllDocuments(authDto: ServiceAAuthDto): Promise<CreateManyResult> {
    this.logger.log(`Importing all documents from remote service`);

    return firstValueFrom(this.documentsClient.getList(authDto))
      .then(async (importedDocuments) => this.documentsRepository.createMany(importedDocuments))
      .then((result) => {
        const { count, skipped } = result;

        this.logger.log(`Imported documents n="${count}"; skipped="${skipped}"`);

        return result;
      })
      .catch((error) => {
        if (error instanceof HttpException) throw error;

        throw new InternalServerErrorException(
          `An unexpected error occurred while importing documents. Original error: ${inspect(error)}`,
        );
      });
  }

  async importDocument(refKey: string, authDto: ServiceAAuthDto): Promise<Document | null> {
    this.logger.log(`Importing document="${refKey}" from remote service`);

    return firstValueFrom(this.documentsClient.get(refKey, authDto))
      .then((doc) => this.documentsRepository.create(doc.refKey, doc.title))
      .catch((error) => {
        if (error instanceof HttpException) throw error;

        throw new InternalServerErrorException(
          `An unexpected error occurred while importing document="${refKey}". Original error: ${inspect(error)}`,
        );
      });
  }

  async requestDocumentCreation(dto: EditRemoteDocumentDto, auth: ServiceAAuthDto): Promise<RemoteDocumentDto> {
    this.logger.log(`Creating document in remote service with title="${dto.title}"`);

    return firstValueFrom(this.documentsClient.create(dto.title, auth)).catch((error) => {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        `An unexpected error occurred while creating in remote service. Original error: ${inspect(error)}`,
      );
    });
  }

  async requestDocumentUpdate(
    refKey: string,
    dto: EditRemoteDocumentDto,
    auth: ServiceAAuthDto,
  ): Promise<RemoteDocumentDto> {
    this.logger.log(`Updating document="${refKey}" in remote service with title="${dto.title}"`);

    return firstValueFrom(this.documentsClient.update(refKey, dto.title, auth)).catch((error) => {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        `An unexpected error occurred while updating document="${refKey}" in remote service. Original error: ${inspect(error)}`,
      );
    });
  }

  async requestDocumentRemoval(refKey: string, authDto: ServiceAAuthDto): Promise<RemoteDocumentDto> {
    this.logger.log(`Removing document="${refKey}" in remote service`);

    return firstValueFrom(this.documentsClient.delete(refKey, authDto)).catch((error) => {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        `An unexpected error occurred while removing document="${refKey}" in remote service. Original error: ${inspect(error)}`,
      );
    });
  }
}
