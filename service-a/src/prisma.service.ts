import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  logger = new Logger(PrismaService.name)

  async onModuleInit() {
    this.logger.log(`Prisma client connecting`)
    await this.$connect();
  }
  async onModuleDestroy() {
    this.logger.log(`Prisma client disconnecting`)
    await this.$disconnect();
  }
}
