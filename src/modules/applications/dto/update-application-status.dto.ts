import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsEnum(['accepted', 'rejected'])
  @IsNotEmpty()
  status: 'accepted' | 'rejected';
}
