import { IsNumber } from 'class-validator';

export class RequestFriendDto {
  @IsNumber()
  userId: number;
}
