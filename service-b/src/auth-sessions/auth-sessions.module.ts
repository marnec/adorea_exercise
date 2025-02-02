import { Module } from '@nestjs/common';
import { AuthSessionsRepository } from './auth-sessions.repository';
import { PrismaModule } from 'src/prisma.module';

@Module({ imports: [PrismaModule], providers: [AuthSessionsRepository], exports: [AuthSessionsRepository] })
export class AuthSessionsModule {}
