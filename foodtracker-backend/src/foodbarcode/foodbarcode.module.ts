import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Food } from "src/food/entities/food.entity";
import { FoodModule } from "src/food/food.module";

import { FoodBarcodeController } from "./foodbarcode.controller";
import { FoodBarcodeService } from "./foodbarcode.service";
import { FoodBarcode } from "./entities/foodbarcode.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FoodBarcode, Food]), FoodModule],
  controllers: [FoodBarcodeController],
  providers: [FoodBarcodeService],
})
export class FoodBarcodeModule {}
