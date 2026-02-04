import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { FoodService } from "src/food/food.service";
import { Food } from "src/food/entities/food.entity";

import { FoodBarcodeService } from "./foodbarcode.service";
import { FoodBarcode } from "./entities/foodbarcode.entity";

describe("FoodBarcodeService", () => {
  let service: FoodBarcodeService;
  const foodBarcodeRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const foodRepository = {
    createQueryBuilder: jest.fn(),
  };
  const foodService = {
    createFood: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodBarcodeService,
        { provide: getRepositoryToken(FoodBarcode), useValue: foodBarcodeRepository },
        { provide: getRepositoryToken(Food), useValue: foodRepository },
        { provide: FoodService, useValue: foodService },
      ],
    }).compile();

    service = module.get<FoodBarcodeService>(FoodBarcodeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a barcode mapping using a matched food", async () => {
    const food = { id: 10, name: "Granola" } as Food;
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(food),
    };

    foodRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    foodBarcodeRepository.findOne.mockResolvedValue(null);

    const result = await service.upsertBarcodeMappings([
      {
        barcode: "00012345",
        food: {
          name: "Granola",
          calories: 100,
          protein: 1,
          carbs: 20,
          fat: 2,
          fiber: 1,
          sugar: 5,
          sodium: 10,
        },
      },
    ]);

    expect(foodService.createFood).not.toHaveBeenCalled();
    expect(foodBarcodeRepository.save).toHaveBeenCalledWith({ barcode: "00012345", food });
    expect(result.matchedFoods).toBe(1);
    expect(result.barcodesCreated).toBe(1);
  });

  it("creates a new food and updates an existing barcode mapping", async () => {
    const createdFood = { id: 99, name: "Protein Shake" } as Food;
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const existingMapping = { barcode: "987654", food: { id: 1 } };

    foodRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    foodService.createFood.mockResolvedValue(createdFood);
    foodBarcodeRepository.findOne.mockResolvedValue(existingMapping);

    const result = await service.upsertBarcodeMappings([
      {
        barcode: "987654",
        food: {
          name: "Protein Shake",
          calories: 200,
          protein: 30,
          carbs: 10,
          fat: 4,
          fiber: 2,
          sugar: 5,
          sodium: 100,
        },
      },
    ]);

    expect(foodService.createFood).toHaveBeenCalled();
    expect(foodBarcodeRepository.save).toHaveBeenCalledWith({ ...existingMapping, food: createdFood });
    expect(result.createdFoods).toBe(1);
    expect(result.barcodesUpdated).toBe(1);
  });
});
