import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

@InputType()
export class CreateApplicationDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  userCV: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userSoftSkills: string[];
}
