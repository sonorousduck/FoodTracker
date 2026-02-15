import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FoodService } from './food.service';
import { Food } from './entities/food.entity';
import { FoodSearchService } from './food-search.service';

describe('FoodService', () => {
  let service: FoodService;
  const foodRepository = {
    findBy: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const foodSearchService = {
    searchFoodsByName: jest.fn(),
    bulkIndexFoods: jest.fn(),
    indexFood: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodService,
        { provide: getRepositoryToken(Food), useValue: foodRepository },
        { provide: FoodSearchService, useValue: foodSearchService },
      ],
    }).compile();

    service = module.get<FoodService>(FoodService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns foods in search order', async () => {
    const foodOne = { id: 1, name: 'Apple' } as Food;
    const foodTwo = { id: 2, name: 'Banana' } as Food;

    foodSearchService.searchFoodsByName.mockResolvedValueOnce([2, 1]);
    foodRepository.find.mockResolvedValueOnce([foodOne, foodTwo]);

    const result = await service.getFoodsByName('fruit', 10);

    expect(result.map((food) => food.id)).toEqual([2, 1]);
  });

  it('creates foods with micronutrients from the CSV import', async () => {
    const createFoodDto = {
      sourceId: '123',
      name: 'Test Food',
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 2,
      sugar: 1,
      sodium: 50,
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 10,
      addedSugar: 3,
      netCarbs: 18,
      solubleFiber: 1,
      insolubleFiber: 1,
      water: 70,
      pralScore: -3.5,
      omega3: 25,
      omega6: 40,
      calcium: 100,
      iron: 2.5,
      potassium: 300,
      magnesium: 50,
      vitaminAiu: 200,
      vitaminArae: 50,
      vitaminC: 6,
      vitaminB12: 0.8,
      vitaminD: 1,
      vitaminE: 0.5,
      phosphorus: 120,
      zinc: 1.2,
      copper: 0.1,
      manganese: 0.05,
      selenium: 10,
      fluoride: 0.2,
      molybdenum: 5,
      chlorine: 20,
      vitaminB1: 0.2,
      vitaminB2: 0.1,
      vitaminB3: 1.5,
      vitaminB5: 0.4,
      vitaminB6: 0.3,
      biotin: 2,
      folate: 20,
      folicAcid: 0,
      foodFolate: 20,
      folateDfe: 30,
      choline: 10,
      betaine: 5,
      retinol: 0,
      caroteneBeta: 12,
      caroteneAlpha: 3,
      lycopene: 0,
      luteinZeaxanthin: 1,
      vitaminD2: 0,
      vitaminD3: 1,
      vitaminDiu: 40,
      vitaminK: 2,
      dihydrophylloquinone: 0,
      menaquinone4: 0,
      monoFat: 100,
      polyFat: 50,
      ala: 10,
      epa: 2,
      dpa: 1,
      dha: 3,
    };

    foodRepository.findOneBy.mockResolvedValueOnce(null);
    foodRepository.save.mockResolvedValueOnce(createFoodDto);

    await service.createFood(createFoodDto);

    expect(foodRepository.save).toHaveBeenCalledWith({ ...createFoodDto, isCsvFood: true });
    expect(foodSearchService.indexFood).toHaveBeenCalledWith({
      ...createFoodDto,
      isCsvFood: true,
    });
  });
});
