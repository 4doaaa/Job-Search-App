import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray } from 'class-validator';

@InputType()
export class UpdateJobDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  jobLocation?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  workingTime?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  seniorityLevel?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  jobDescription?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  technicalSkills?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  softSkills?: string[];
}
