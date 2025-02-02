import { Module } from "@nestjs/common";
import { DocumentsSyncService } from "./documents.service";
import { ServiceAClient } from "../serviceA/service-a.client";
import { DocumentsRepository } from "./documents.repository";
import { PrismaModule } from "src/prisma.module";
import { DocumentsController } from "./documents.controller";
import { ServiceAModule } from "src/serviceA/service-a.module";

@Module({
  imports: [PrismaModule, ServiceAModule],
  controllers: [DocumentsController],
  providers: [DocumentsSyncService, DocumentsRepository]
})
export class DocumentsModule {}