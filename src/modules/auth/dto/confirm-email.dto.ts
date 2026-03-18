import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  otp: string;
}
