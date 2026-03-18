import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { ImageResponse } from './common.types';

@ObjectType()
export class User {
  @Field(() => ID)
  _id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  mobileNumber: string;

  @Field()
  gender: string;

  @Field()
  DOB: string;

  @Field()
  role: string;

  @Field()
  isConfirmed: boolean;

  @Field(() => ImageResponse, { nullable: true })
  profilePic?: ImageResponse;

  @Field(() => ImageResponse, { nullable: true })
  coverPic?: ImageResponse;

  @Field({ nullable: true })
  bannedAt?: Date;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field({ nullable: true })
  changeCredentialTime?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Company {
  @Field(() => ID)
  _id: string;

  @Field()
  companyName: string;

  @Field()
  industry: string;

  @Field()
  companyEmail: string;

  @Field()
  isApproved: boolean;

  @Field()
  isBanned: boolean;

  @Field(() => ImageResponse, { nullable: true })
  logo?: ImageResponse;

  @Field(() => ImageResponse, { nullable: true })
  coverImage?: ImageResponse;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AdminDashboardData {
  @Field(() => [User])
  users: User[];

  @Field(() => [Company])
  companies: Company[];
}
