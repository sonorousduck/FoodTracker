import { IsDate, IsNumber } from 'class-validator';


export class CreateWeightDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  weightEntry: number;

  @IsDate()
  date: Date;
}
