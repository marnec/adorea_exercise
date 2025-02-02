import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ServiceAAuthDto } from 'src/serviceA/service-a-auth.dto';

export const BasicAuth = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const logger = new Logger(BasicAuth.name);

  const request = ctx.switchToHttp().getRequest();
  const authHeader = request.headers['authorization'];

  logger.debug(authHeader);

  if (!authHeader) {
    throw new UnauthorizedException('Missing credentials headers in request (use basic auth plain text)');
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    return { email, password } as ServiceAAuthDto;
  } catch (err) {
    throw new BadRequestException('Malformed basic auth');
  }
});
