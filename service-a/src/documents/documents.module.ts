import { Module } from '@nestjs/common';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaService } from 'src/prisma.service';
import { DocumentsRepository } from './documents.repository';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, DocumentsRepository],
})
export class DocumentsModule {}
