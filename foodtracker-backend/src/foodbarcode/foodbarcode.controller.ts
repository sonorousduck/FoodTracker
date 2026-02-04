import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PassportJwtAuthGuard } from "src/auth/guards/passportjwt.guard";

import { CreateFoodBarcodeDto } from "./dto/createfoodbarcode.dto";
import { FoodBarcodeService } from "./foodbarcode.service";

@Controller("food-barcodes")
export class FoodBarcodeController {
  constructor(private readonly foodBarcodeService: FoodBarcodeService) {}

  @Post("bulk")
  @UseGuards(PassportJwtAuthGuard)
  upsertBulk(@Body() items: CreateFoodBarcodeDto[]) {
    return this.foodBarcodeService.upsertBarcodeMappings(items);
  }

  @Get(":barcode")
  @UseGuards(PassportJwtAuthGuard)
  getFoodByBarcode(@Param("barcode") barcode: string) {
    return this.foodBarcodeService.getFoodByBarcode(barcode);
  }
}
