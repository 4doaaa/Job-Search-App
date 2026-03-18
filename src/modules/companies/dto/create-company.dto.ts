import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { Industry } from '../enums/industry.enum';

@InputType()
export class CreateCompanyDto {
  @Field()
  @IsString()
  companyName: string;

  @Field()
  @IsEmail()
  companyEmail: string;

  @Field()
  @IsString()
  description: string;

  @Field()
  @IsString()
  website: string;

  @Field()
  @IsString()
  size: string;

  @Field()
  @IsEnum(Industry)
  industry: Industry;

  @Field()
  @IsString()
  location: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
