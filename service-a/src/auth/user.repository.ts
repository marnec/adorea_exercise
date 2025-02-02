import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {
  logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  create(email: string, password: string): Promise<User> {
    this.logger.debug(`Inserting new user="${email}"`);

    return this.prisma.user.create({
      data: {
        email,
        password,
      },
    });
  }

  get(email: string): Promise<User> {
    this.logger.debug(`Fetching user="${email}"`);

    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
