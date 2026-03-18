import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { Industry } from '../enums/industry.enum';

@InputType()
export class UpdateCompanyDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  website?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  size?: string;

  @Field(() => Industry, { nullable: true })
  @IsOptional()
  @IsEnum(Industry)
  industry?: Industry;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
