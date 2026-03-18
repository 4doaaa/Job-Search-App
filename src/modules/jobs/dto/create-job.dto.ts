import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateJobDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  jobLocation: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  workingTime: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  seniorityLevel: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  technicalSkills: string[];

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  softSkills: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  companyId: string;
}
