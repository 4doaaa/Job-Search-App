import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class GetJobsDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  companyId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  companyName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string; 

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
