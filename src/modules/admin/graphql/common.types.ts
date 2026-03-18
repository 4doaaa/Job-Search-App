import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ImageResponse {
  @Field(() => String, { nullable: true })
  secure_url?: string;

  @Field(() => String, { nullable: true })
  public_id?: string;
}
