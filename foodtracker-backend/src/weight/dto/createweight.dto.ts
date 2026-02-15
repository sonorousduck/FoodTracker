import { IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWeightDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  weightEntry: number;

  @Type(() => Date)
  @IsDate()
  date: Date;
}
