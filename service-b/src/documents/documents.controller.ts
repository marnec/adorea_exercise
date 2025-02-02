import { Body, Controller, Delete, Logger, Param, Put } from '@nestjs/common';
import { Document } from '@prisma/client';
import { RemoteDocumentDto } from 'src/serviceA/dto/remote-document.dto';
import { ServiceAAuthDto } from 'src/serviceA/service-a-auth.dto';
import { DocumentsSyncService } from './documents.service';
import { CreateManyResult } from './dto/create-many-result.dto';
import { EditRemoteDocumentDto } from './dto/edit-remote-document.dto';
import { BasicAuth } from 'src/middleware/basic-auth-decorator';

@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsSyncService) {}

  @Put('sync')
  async syncMany(@BasicAuth() authDto: ServiceAAuthDto): Promise<CreateManyResult> {
    this.logger.log(`Requested a full sync`);

    return this.documentsService.importAllDocuments(authDto);
  }

  @Put('sync/:key')
  async syncOne(@Param('key') refKey: string, @BasicAuth() authDto: ServiceAAuthDto): Promise<Document | null> {
    this.logger.log(`Requested sync of remote document="${refKey}"`);

    return this.documentsService.importDocument(refKey, authDto);
  }

  @Put('remote')
  async insert(@Body() dto: EditRemoteDocumentDto, @BasicAuth() authDto: ServiceAAuthDto): Promise<RemoteDocumentDto> {
    this.logger.log(`Requested creation of document with title="${dto.title}"`);

    return this.documentsService.requestDocumentCreation(dto, authDto);
  }

  @Put('remote/:key')
  async update(
    @Param('key') refKey: string,
    @Body() dto: EditRemoteDocumentDto,
    @BasicAuth() authDto: ServiceAAuthDto,
  ): Promise<RemoteDocumentDto> {
    this.logger.log(`Requested update of document="${refKey}"`);

    return this.documentsService.requestDocumentUpdate(refKey, dto, authDto);
  }

  @Delete('remote/:key')
  async delete(@Param('key') refKey: string, @BasicAuth() authDto: ServiceAAuthDto): Promise<RemoteDocumentDto> {
    this.logger.log(`Requested deletion of document="${refKey}"`);

    return this.documentsService.requestDocumentRemoval(refKey, authDto);
  }
}
