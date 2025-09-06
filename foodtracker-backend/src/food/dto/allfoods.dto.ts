import { Food } from "../entities/food.entity";


export class AllFoodsDto {
  foods: Food[];
  totalCount: number;
  pageNumber: number;
  limit: number;
}
