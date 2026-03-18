import { IsString, IsOptional, IsDateString, IsEnum, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsDateString()
  @IsOptional()
  DOB?: string;

  @IsEnum(['Male', 'Female'])
  @IsOptional()
  gender?: 'Male' | 'Female';

  @IsObject()
  @IsOptional()
  profilePic?: {
    secure_url?: string;
    public_id?: string;
  };

  @IsObject()
  @IsOptional()
  coverPic?: {
    secure_url?: string;
    public_id?: string;
  };
}
