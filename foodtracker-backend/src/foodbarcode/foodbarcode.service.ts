import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateFoodDto } from 'src/food/dto/createfood.dto';
import { Food } from 'src/food/entities/food.entity';
import { FoodService } from 'src/food/food.service';
import { Repository } from 'typeorm';

import { CreateFoodBarcodeDto } from './dto/createfoodbarcode.dto';
import { FoodBarcode } from './entities/foodbarcode.entity';

type UpsertSummary = {
  createdFoods: number;
  matchedFoods: number;
  barcodesCreated: number;
  barcodesUpdated: number;
  errors: Array<{ barcode: string; reason: string }>;
};

const NUMERIC_FIELDS = [
  'calories',
  'protein',
  'carbs',
  'fat',
  'fiber',
  'sugar',
  'sodium',
  'saturatedFat',
  'transFat',
  'cholesterol',
  'addedSugar',
  'netCarbs',
  'solubleFiber',
  'insolubleFiber',
  'water',
  'pralScore',
  'omega3',
  'omega6',
  'calcium',
  'iron',
  'potassium',
  'magnesium',
  'vitaminAiu',
  'vitaminArae',
  'vitaminC',
  'vitaminB12',
  'vitaminD',
  'vitaminE',
  'phosphorus',
  'zinc',
  'copper',
  'manganese',
  'selenium',
  'fluoride',
  'molybdenum',
  'chlorine',
  'vitaminB1',
  'vitaminB2',
  'vitaminB3',
  'vitaminB5',
  'vitaminB6',
  'biotin',
  'folate',
  'folicAcid',
  'foodFolate',
  'folateDfe',
  'choline',
  'betaine',
  'retinol',
  'caroteneBeta',
  'caroteneAlpha',
  'lycopene',
  'luteinZeaxanthin',
  'vitaminD2',
  'vitaminD3',
  'vitaminDiu',
  'vitaminK',
  'dihydrophylloquinone',
  'menaquinone4',
  'monoFat',
  'polyFat',
  'ala',
  'epa',
  'dpa',
  'dha',
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];
type NormalizedFood = CreateFoodDto & Record<NumericField, number>;

@Injectable()
export class FoodBarcodeService {
  constructor(
    @InjectRepository(FoodBarcode)
    private readonly foodBarcodeRepository: Repository<FoodBarcode>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    private readonly foodService: FoodService,
  ) {}

  async upsertBarcodeMappings(
    items: CreateFoodBarcodeDto[],
  ): Promise<UpsertSummary> {
    const summary: UpsertSummary = {
      createdFoods: 0,
      matchedFoods: 0,
      barcodesCreated: 0,
      barcodesUpdated: 0,
      errors: [],
    };

    for (const item of items) {
      const barcode = this.normalizeBarcode(item.barcode);
      if (!barcode) {
        summary.errors.push({
          barcode: item.barcode ?? '',
          reason: 'Missing barcode',
        });
        continue;
      }

      const normalizedFood = this.normalizeFoodDto(item.food);
      if (!normalizedFood.name) {
        summary.errors.push({ barcode, reason: 'Missing food name' });
        continue;
      }

      let food = await this.findMatchingFood(
        normalizedFood.name,
        normalizedFood,
      );
      if (food) {
        summary.matchedFoods += 1;
      } else {
        food = await this.foodService.createFood(normalizedFood);
        summary.createdFoods += 1;
      }

      const existingMapping = await this.foodBarcodeRepository.findOne({
        where: { barcode },
        relations: ['food'],
      });

      if (existingMapping) {
        if (existingMapping.food?.id !== food.id) {
          existingMapping.food = food;
          await this.foodBarcodeRepository.save(existingMapping);
          summary.barcodesUpdated += 1;
        }
      } else {
        await this.foodBarcodeRepository.save({ barcode, food });
        summary.barcodesCreated += 1;
      }
    }

    return summary;
  }

  async getFoodByBarcode(barcode: string): Promise<Food | null> {
    const normalized = this.normalizeBarcode(barcode);
    if (!normalized) {
      return null;
    }

    const mapping = await this.foodBarcodeRepository.findOne({
      where: { barcode: normalized },
      relations: ['food', 'food.measurements'],
    });

    return mapping?.food ?? null;
  }

  private normalizeBarcode(value?: string): string {
    return (value ?? '').trim();
  }

  private normalizeFoodDto(food: CreateFoodDto): NormalizedFood {
    const numeric: Record<NumericField, number> = {
      calories: this.normalizeNumber(food.calories, 0),
      protein: this.normalizeNumber(food.protein, 2),
      carbs: this.normalizeNumber(food.carbs, 2),
      fat: this.normalizeNumber(food.fat, 2),
      fiber: this.normalizeNumber(food.fiber, 2),
      sugar: this.normalizeNumber(food.sugar, 2),
      sodium: this.normalizeNumber(food.sodium, 2),
      saturatedFat: this.normalizeNumber(food.saturatedFat, 2),
      transFat: this.normalizeNumber(food.transFat, 2),
      cholesterol: this.normalizeNumber(food.cholesterol, 4),
      addedSugar: this.normalizeNumber(food.addedSugar, 2),
      netCarbs: this.normalizeNumber(food.netCarbs, 2),
      solubleFiber: this.normalizeNumber(food.solubleFiber, 2),
      insolubleFiber: this.normalizeNumber(food.insolubleFiber, 2),
      water: this.normalizeNumber(food.water, 2),
      pralScore: this.normalizeNumber(food.pralScore, 2),
      omega3: this.normalizeNumber(food.omega3, 4),
      omega6: this.normalizeNumber(food.omega6, 4),
      calcium: this.normalizeNumber(food.calcium, 4),
      iron: this.normalizeNumber(food.iron, 4),
      potassium: this.normalizeNumber(food.potassium, 4),
      magnesium: this.normalizeNumber(food.magnesium, 4),
      vitaminAiu: this.normalizeNumber(food.vitaminAiu, 2),
      vitaminArae: this.normalizeNumber(food.vitaminArae, 4),
      vitaminC: this.normalizeNumber(food.vitaminC, 4),
      vitaminB12: this.normalizeNumber(food.vitaminB12, 4),
      vitaminD: this.normalizeNumber(food.vitaminD, 4),
      vitaminE: this.normalizeNumber(food.vitaminE, 4),
      phosphorus: this.normalizeNumber(food.phosphorus, 4),
      zinc: this.normalizeNumber(food.zinc, 4),
      copper: this.normalizeNumber(food.copper, 4),
      manganese: this.normalizeNumber(food.manganese, 4),
      selenium: this.normalizeNumber(food.selenium, 4),
      fluoride: this.normalizeNumber(food.fluoride, 4),
      molybdenum: this.normalizeNumber(food.molybdenum, 4),
      chlorine: this.normalizeNumber(food.chlorine, 4),
      vitaminB1: this.normalizeNumber(food.vitaminB1, 4),
      vitaminB2: this.normalizeNumber(food.vitaminB2, 4),
      vitaminB3: this.normalizeNumber(food.vitaminB3, 4),
      vitaminB5: this.normalizeNumber(food.vitaminB5, 4),
      vitaminB6: this.normalizeNumber(food.vitaminB6, 4),
      biotin: this.normalizeNumber(food.biotin, 4),
      folate: this.normalizeNumber(food.folate, 4),
      folicAcid: this.normalizeNumber(food.folicAcid, 4),
      foodFolate: this.normalizeNumber(food.foodFolate, 4),
      folateDfe: this.normalizeNumber(food.folateDfe, 4),
      choline: this.normalizeNumber(food.choline, 4),
      betaine: this.normalizeNumber(food.betaine, 4),
      retinol: this.normalizeNumber(food.retinol, 4),
      caroteneBeta: this.normalizeNumber(food.caroteneBeta, 4),
      caroteneAlpha: this.normalizeNumber(food.caroteneAlpha, 4),
      lycopene: this.normalizeNumber(food.lycopene, 4),
      luteinZeaxanthin: this.normalizeNumber(food.luteinZeaxanthin, 4),
      vitaminD2: this.normalizeNumber(food.vitaminD2, 4),
      vitaminD3: this.normalizeNumber(food.vitaminD3, 4),
      vitaminDiu: this.normalizeNumber(food.vitaminDiu, 2),
      vitaminK: this.normalizeNumber(food.vitaminK, 4),
      dihydrophylloquinone: this.normalizeNumber(
        food.dihydrophylloquinone,
        4,
      ),
      menaquinone4: this.normalizeNumber(food.menaquinone4, 4),
      monoFat: this.normalizeNumber(food.monoFat, 4),
      polyFat: this.normalizeNumber(food.polyFat, 4),
      ala: this.normalizeNumber(food.ala, 4),
      epa: this.normalizeNumber(food.epa, 4),
      dpa: this.normalizeNumber(food.dpa, 4),
      dha: this.normalizeNumber(food.dha, 4),
    };

    return {
      ...food,
      name: food.name?.trim(),
      ...numeric,
    };
  }

  private normalizeNumber(value: number | undefined, scale: number): number {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    if (scale === 0) {
      return Math.round(numeric);
    }
    const factor = 10 ** scale;
    return Math.round(numeric * factor) / factor;
  }

  private async findMatchingFood(
    name: string,
    normalizedFood: NormalizedFood,
  ): Promise<Food | null> {
    const query = this.foodRepository
      .createQueryBuilder('food')
      .where('food.name = :name', { name });

    for (const field of NUMERIC_FIELDS) {
      query.andWhere(`food.${field} = :${field}`, {
        [field]: normalizedFood[field],
      });
    }

    return query.getOne();
  }
}
