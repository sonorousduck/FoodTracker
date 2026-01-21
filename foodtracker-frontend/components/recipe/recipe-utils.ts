import { Colors } from '@/constants/Colors';
import { Food } from '@/types/food/food';
import { FoodMeasurement } from '@/types/foodmeasurement/foodmeasurement';
import { RecipeFood } from '@/types/recipefood/recipefood';

export type RecipeColors = typeof Colors.light;

export type NutritionRow = {
  key: keyof Food;
  label: string;
  value: number | null;
  unit: string;
};

export type NutritionTotals = Partial<Record<keyof Food, number>>;

export type IngredientEntry = Pick<
  RecipeFood,
  'food' | 'servings' | 'measurementId'
>;

type NutritionField = {
  key: keyof Food;
  label: string;
  unit: string;
};

const coreNutritionFields: NutritionField[] = [
  { key: 'calories', label: 'Calories', unit: 'cal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
];

const macroNutritionFields: NutritionField[] = coreNutritionFields.filter(
  (field) => field.key !== 'calories',
);

const nutritionFields: NutritionField[] = [
  ...coreNutritionFields,
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g' },
  { key: 'transFat', label: 'Trans fat', unit: 'g' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'addedSugar', label: 'Added sugar', unit: 'g' },
  { key: 'netCarbs', label: 'Net carbs', unit: 'g' },
  { key: 'solubleFiber', label: 'Soluble fiber', unit: 'g' },
  { key: 'insolubleFiber', label: 'Insoluble fiber', unit: 'g' },
  { key: 'water', label: 'Water', unit: 'g' },
  { key: 'pralScore', label: 'PRAL score', unit: '' },
  { key: 'omega3', label: 'Omega 3', unit: 'mg' },
  { key: 'omega6', label: 'Omega 6', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
  { key: 'vitaminAiu', label: 'Vitamin A', unit: 'IU' },
  { key: 'vitaminArae', label: 'Vitamin A (RAE)', unit: 'mcg' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
  { key: 'vitaminE', label: 'Vitamin E', unit: 'mg' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg' },
  { key: 'zinc', label: 'Zinc', unit: 'mg' },
  { key: 'copper', label: 'Copper', unit: 'mg' },
  { key: 'manganese', label: 'Manganese', unit: 'mg' },
  { key: 'selenium', label: 'Selenium', unit: 'mcg' },
  { key: 'fluoride', label: 'Fluoride', unit: 'mg' },
  { key: 'molybdenum', label: 'Molybdenum', unit: 'mcg' },
  { key: 'chlorine', label: 'Chlorine', unit: 'mg' },
  { key: 'vitaminB1', label: 'Vitamin B1', unit: 'mg' },
  { key: 'vitaminB2', label: 'Vitamin B2', unit: 'mg' },
  { key: 'vitaminB3', label: 'Vitamin B3', unit: 'mg' },
  { key: 'vitaminB5', label: 'Vitamin B5', unit: 'mg' },
  { key: 'vitaminB6', label: 'Vitamin B6', unit: 'mg' },
  { key: 'biotin', label: 'Biotin', unit: 'mcg' },
  { key: 'folate', label: 'Folate', unit: 'mcg' },
  { key: 'folicAcid', label: 'Folic acid', unit: 'mcg' },
  { key: 'foodFolate', label: 'Food folate', unit: 'mcg' },
  { key: 'folateDfe', label: 'Folate DFE', unit: 'mcg' },
  { key: 'choline', label: 'Choline', unit: 'mg' },
  { key: 'betaine', label: 'Betaine', unit: 'mg' },
  { key: 'retinol', label: 'Retinol', unit: 'mcg' },
  { key: 'caroteneBeta', label: 'Carotene beta', unit: 'mcg' },
  { key: 'caroteneAlpha', label: 'Carotene alpha', unit: 'mcg' },
  { key: 'lycopene', label: 'Lycopene', unit: 'mcg' },
  { key: 'luteinZeaxanthin', label: 'Lutein zeaxanthin', unit: 'mcg' },
  { key: 'vitaminD2', label: 'Vitamin D2', unit: 'mcg' },
  { key: 'vitaminD3', label: 'Vitamin D3', unit: 'mcg' },
  { key: 'vitaminDiu', label: 'Vitamin D (IU)', unit: 'IU' },
  { key: 'vitaminK', label: 'Vitamin K', unit: 'mcg' },
  { key: 'dihydrophylloquinone', label: 'Dihydrophylloquinone', unit: 'mcg' },
  { key: 'menaquinone4', label: 'Menaquinone-4', unit: 'mcg' },
  { key: 'monoFat', label: 'Monounsaturated fat', unit: 'g' },
  { key: 'polyFat', label: 'Polyunsaturated fat', unit: 'g' },
  { key: 'ala', label: 'ALA', unit: 'mg' },
  { key: 'epa', label: 'EPA', unit: 'mg' },
  { key: 'dpa', label: 'DPA', unit: 'mg' },
  { key: 'dha', label: 'DHA', unit: 'mg' },
];

export const getFoodMeasurements = (food: Food) =>
  Array.isArray(food.measurements) ? food.measurements : [];

export const getDefaultMeasurement = (food: Food) => {
  const measurements = getFoodMeasurements(food);
  return (
    measurements.find((measurement) => measurement.isDefault) ??
    measurements[0]
  );
};

export const getMeasurementById = (food: Food, measurementId: number | null) => {
  if (measurementId === null) {
    return undefined;
  }
  return getFoodMeasurements(food).find(
    (measurement) => measurement.id === measurementId,
  );
};

export const getMeasurementGrams = (measurement?: FoodMeasurement) =>
  measurement ? measurement.weightInGrams : 100;

export const formatMeasurementText = (measurement?: FoodMeasurement) => {
  if (!measurement) {
    return '100 g';
  }
  return measurement.name || measurement.abbreviation || '100 g';
};

export const formatCalories = (value: number) => `${Math.round(value)} cal`;

export const normalizeAmount = (value: string) => {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const [whole, ...decimals] = sanitized.split('.');

  if (decimals.length === 0) {
    return whole;
  }

  return `${whole}.${decimals.join('')}`;
};

export const getCaloriesForMeasurement = (
  food: Food,
  measurement: FoodMeasurement | undefined,
  servingCount: number,
) => {
  const grams = getMeasurementGrams(measurement) * servingCount;
  return (food.calories * grams) / 100;
};

export const buildNutritionRows = (
  food: Food,
  measurement: FoodMeasurement | undefined,
  servings: number,
): NutritionRow[] => {
  const grams = getMeasurementGrams(measurement) * servings;
  return buildNutritionRowsFromFields(food, grams, nutritionFields, true);
};

export const buildCoreNutritionRows = (
  food: Food,
  measurement: FoodMeasurement | undefined,
  servings: number,
): NutritionRow[] => {
  const grams = getMeasurementGrams(measurement) * servings;
  return coreNutritionFields.map((field) => {
    const parsedValue = coerceNumber(food[field.key]);
    if (parsedValue === null) {
      return {
        key: field.key,
        label: field.label,
        value: null,
        unit: field.unit,
      };
    }
    const scaledValue = (parsedValue * grams) / 100;
    const roundedValue =
      field.key === 'calories'
        ? Math.round(scaledValue)
        : Number(scaledValue.toFixed(2));
    return {
      key: field.key,
      label: field.label,
      value: roundedValue,
      unit: field.unit,
    };
  });
};

export const getFoodNutritionTotals = (
  food: Food,
  measurement: FoodMeasurement | undefined,
  servings: number,
): NutritionTotals => {
  const grams = getMeasurementGrams(measurement) * servings;
  return buildNutritionTotalsFromFields(food, grams, nutritionFields);
};

export const getIngredientNutritionTotals = (
  ingredients: IngredientEntry[],
): NutritionTotals => {
  const totals: NutritionTotals = {};
  ingredients.forEach((ingredient) => {
    const measurement =
      getMeasurementById(ingredient.food, ingredient.measurementId ?? null) ??
      getDefaultMeasurement(ingredient.food);
    const servings = Number(ingredient.servings);
    if (!Number.isFinite(servings) || servings <= 0) {
      return;
    }
    const grams = getMeasurementGrams(measurement) * servings;
    const entryTotals = buildNutritionTotalsFromFields(
      ingredient.food,
      grams,
      nutritionFields,
    );
    addNutritionTotals(totals, entryTotals);
  });
  return totals;
};

export const addNutritionTotals = (
  target: NutritionTotals,
  addition: NutritionTotals,
): void => {
  nutritionFields.forEach((field) => {
    const value = addition[field.key];
    if (value == null || !Number.isFinite(value)) {
      return;
    }
    target[field.key] = (target[field.key] ?? 0) + value;
  });
};

export const scaleNutritionTotals = (
  totals: NutritionTotals,
  factor: number,
): NutritionTotals => {
  const scaled: NutritionTotals = {};
  nutritionFields.forEach((field) => {
    const value = totals[field.key];
    if (value == null) {
      return;
    }
    scaled[field.key] = value * factor;
  });
  return scaled;
};

export const buildMacroNutritionRowsFromTotals = (
  totals: NutritionTotals,
  includeZero: boolean = true,
  includeCalories: boolean = false,
): NutritionRow[] => {
  const fields = includeCalories
    ? coreNutritionFields
    : macroNutritionFields;
  return buildNutritionRowsFromTotalsAndFields(totals, fields, includeZero);
};

export const buildCoreNutritionRowsFromTotals = (
  totals: NutritionTotals,
  includeZero: boolean = true,
): NutritionRow[] =>
  buildNutritionRowsFromTotalsAndFields(
    totals,
    coreNutritionFields,
    includeZero,
  );

export const buildNutritionRowsFromTotals = (
  totals: NutritionTotals,
  includeZero: boolean = true,
  includeCalories: boolean = false,
): NutritionRow[] => {
  const fields = includeCalories
    ? nutritionFields
    : nutritionFields.filter((field) => field.key !== 'calories');
  return buildNutritionRowsFromTotalsAndFields(totals, fields, includeZero);
};

const buildNutritionRowsFromFields = (
  food: Food,
  grams: number,
  fields: NutritionField[],
  includeZero: boolean,
): NutritionRow[] => {
  return fields
    .map((field) => {
      const parsedValue = coerceNumber(food[field.key]);
      if (parsedValue === null) {
        return null;
      }
      const scaledValue = (parsedValue * grams) / 100;
      if (!includeZero && scaledValue <= 0) {
        return null;
      }
      const roundedValue =
        field.key === 'calories'
          ? Math.round(scaledValue)
          : Number(scaledValue.toFixed(2));
      return {
        key: field.key,
        label: field.label,
        value: roundedValue,
        unit: field.unit,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
};

const buildNutritionRowsFromTotalsAndFields = (
  totals: NutritionTotals,
  fields: NutritionField[],
  includeZero: boolean,
): NutritionRow[] => {
  return fields
    .map((field) => {
      const rawValue = totals[field.key];
      if (rawValue == null) {
        return includeZero
          ? {
              key: field.key,
              label: field.label,
              value: null,
              unit: field.unit,
            }
          : null;
      }
      if (!includeZero && rawValue <= 0) {
        return null;
      }
      const roundedValue =
        field.key === 'calories'
          ? Math.round(rawValue)
          : Number(rawValue.toFixed(2));
      return {
        key: field.key,
        label: field.label,
        value: roundedValue,
        unit: field.unit,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
};

const buildNutritionTotalsFromFields = (
  food: Food,
  grams: number,
  fields: NutritionField[],
): NutritionTotals => {
  const totals: NutritionTotals = {};
  fields.forEach((field) => {
    const parsedValue = coerceNumber(food[field.key]);
    if (parsedValue === null) {
      return;
    }
    totals[field.key] = (parsedValue * grams) / 100;
  });
  return totals;
};

const coerceNumber = (value: Food[keyof Food]): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
