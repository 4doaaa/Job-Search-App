import { Type } from 'class-transformer';
import { IsEmail, IsString, IsEnum, IsDate, IsNotEmpty, MinLength } from 'class-validator';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  DOB: Date;

  @IsNotEmpty()
  @IsString()
  mobileNumber: string;
}
