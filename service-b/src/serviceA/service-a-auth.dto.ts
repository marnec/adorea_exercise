import { IsNotEmpty, IsString } from 'class-validator';

export class ServiceAAuthDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
