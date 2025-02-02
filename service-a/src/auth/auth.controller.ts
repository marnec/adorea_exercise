import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CredentialsDto } from './dto/redentials.dto';
import { SignupDto } from './dto/singup.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto): Promise<CredentialsDto> {
    this.logger.log(`Requested singup by="${dto.email}"`);

    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<CredentialsDto> {
    this.logger.log(`Requested login by="${dto.email}"`);

    return this.authService.login(dto);
  }
}
