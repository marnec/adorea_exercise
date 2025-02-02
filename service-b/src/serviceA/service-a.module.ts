import { Module } from '@nestjs/common';
import { ServiceAClient } from './service-a.client';
import { AuthSessionsModule } from 'src/auth-sessions/auth-sessions.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, AuthSessionsModule],
  providers: [ServiceAClient],
  exports: [ServiceAClient],
})
export class ServiceAModule {}
