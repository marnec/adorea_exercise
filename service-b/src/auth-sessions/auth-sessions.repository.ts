import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AuthSession } from '@prisma/client';

@Injectable()
export class AuthSessionsRepository {
  logger = new Logger(AuthSessionsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  getSession(userId: string, serviceId: string): Promise<AuthSession> {
    this.logger.debug(`Fetching session for user="${userId}" and service="${serviceId}"`);

    return this.prisma.authSession.findUniqueOrThrow({
      where: { uniqueUserSessionInService: { userId, serviceId } },
    });
  }

  createSession(userId: string, serviceId: string, token: string): Promise<AuthSession> {
    this.logger.debug(`Creating a new session for user="${userId}" and service="${serviceId}"`);

    return this.prisma.authSession.create({ data: { userId, serviceId, token } });
  }

  deleteSession(userId: string, serviceId: string): Promise<AuthSession> {
    this.logger.debug(`Removing session for user="${userId}" and service="${serviceId}"`);

    return this.prisma.authSession.delete({
      where: { uniqueUserSessionInService: { userId, serviceId } },
    });
  }
}
