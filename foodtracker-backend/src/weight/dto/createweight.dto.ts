import { Type } from 'class-transformer';
import { IsDate, IsNumber } from 'class-validator';

export class CreateWeightDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  weightEntry!: number;

  @Type(() => Date)
  @IsDate()
  date!: Date;
}
