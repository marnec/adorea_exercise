import { HttpException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaErrorCodes, saltRounds } from 'src/constants';
import { inspect } from 'util';
import { CredentialsDto } from './dto/redentials.dto';
import { SignupDto } from './dto/singup.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<CredentialsDto> {
    this.logger.log(`Signing up new user with email="${dto.email}"`);

    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    return this.userRepository
      .create(dto.email, hashedPassword)
      .then(async (user) => {
        const token = this.generateToken(user.id, user.email);
        return { token };
      })
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === PrismaErrorCodes.UNIQUE_CONSTRAINT_FAIL
        ) {
          throw new UnauthorizedException(`Email="${dto.email}" already exists`);
        }
        throw new InternalServerErrorException(
          `An unexpected error occurred while creating user. Original error: ${inspect(error)}`,
        );
      });
  }

  async login(dto: SignupDto): Promise<CredentialsDto> {
    this.logger.log(`Signin in user="${dto.email}"`);

    return await this.userRepository
      .get(dto.email)
      .then((user) => {
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = bcrypt.compare(dto.password, user.password);

        return Promise.all([user, isPasswordValid]);
      })
      .then(([user, isPasswordValid]) => {
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        const token = this.generateToken(user.id, user.email);

        return { token };
      })
      .catch((error) => {
        if (error instanceof HttpException) throw error;

        throw new InternalServerErrorException(
          `An unexpected error occurred while authenticating user="${dto.email}". Original error: ${inspect(error)}`,
        );
      });
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
