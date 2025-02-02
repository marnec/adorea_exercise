import { Prisma } from '@prisma/client';

export interface CreateManyResult extends Prisma.BatchPayload {
  skipped: number;
}
