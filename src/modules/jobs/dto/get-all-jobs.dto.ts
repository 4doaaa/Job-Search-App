import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkingTime {
  PART_TIME = 'part-time',
  FULL_TIME = 'full-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship'
}

export enum JobLocation {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid'
}

export enum SeniorityLevel {
  JUNIOR = 'Junior',
  MID_LEVEL = 'Mid-Level',
  SENIOR = 'Senior',
  LEAD = 'Lead',
  MANAGER = 'Manager'
}

@InputType()
export class GetAllJobsDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  workingTime?: WorkingTime;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  jobLocation?: JobLocation;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  seniorityLevel?: SeniorityLevel;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technicalSkills?: string[];

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  page?: number = 1;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
