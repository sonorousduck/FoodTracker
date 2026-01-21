import {
  addNutritionTotals,
  buildMacroNutritionRowsFromTotals,
  buildNutritionRowsFromTotals,
  formatCalories,
  formatMeasurementText,
  getCaloriesForMeasurement,
  getDefaultMeasurement,
  getFoodNutritionTotals,
  getIngredientNutritionTotals,
  getMeasurementById,
  scaleNutritionTotals,
  type NutritionRow,
  type NutritionTotals,
} from '@/components/recipe/recipe-utils';
import { FoodEntry } from '@/types/foodentry/foodentry';
import { Recipe } from '@/types/recipe/recipe';

export const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export type MealName = (typeof mealOrder)[number];

export const getMealTypeFromName = (mealName?: string) => {
  if (!mealName) {
    return 0;
  }
  const index = mealOrder.indexOf(mealName as MealName);
  return index >= 0 ? index : 0;
};

export const getEntryTitle = (entry: FoodEntry) =>
  entry.food?.name ?? entry.recipe?.title ?? 'Unknown item';

export const formatServings = (value?: number | string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return '0';
  }
  const trimmed = parsed.toFixed(4).replace(/\.?0+$/, '');
  return trimmed || '0';
};

export const getEntryServingsText = (entry: FoodEntry) => {
  const servingsText = `${formatServings(entry.servings)} ${
    entry.servings === 1 ? 'serving' : 'servings'
  }`;
  if (entry.food) {
    const measurement =
      entry.measurement ?? getDefaultMeasurement(entry.food);
    return `${servingsText} · ${formatMeasurementText(measurement)}`;
  }
  return servingsText;
};

export const getRecipeTotalCalories = (recipe?: Recipe) => {
  if (!recipe) {
    return null;
  }
  if (typeof recipe.calories === 'number' && Number.isFinite(recipe.calories)) {
    return recipe.calories;
  }
  if (typeof recipe.calories === 'string') {
    const parsed = Number(recipe.calories);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (!Array.isArray(recipe.ingredients)) {
    return null;
  }
  const hasMissingFood = recipe.ingredients.some(
    (ingredient) => !ingredient.food,
  );
  if (hasMissingFood) {
    return null;
  }
  return recipe.ingredients.reduce((total, ingredient) => {
    if (!ingredient.food) {
      return total;
    }
    const measurement =
      getMeasurementById(ingredient.food, ingredient.measurementId ?? null) ??
      getDefaultMeasurement(ingredient.food);
    const calories = getCaloriesForMeasurement(
      ingredient.food,
      measurement,
      ingredient.servings,
    );
    return total + calories;
  }, 0);
};

export const getRecipeCaloriesPerServing = (recipe?: Recipe) => {
  const totalCalories = getRecipeTotalCalories(recipe);
  if (totalCalories == null || !recipe?.servings) {
    return null;
  }
  return totalCalories / recipe.servings;
};

export const getEntryCalories = (entry: FoodEntry) => {
  if (entry.food) {
    const measurement =
      entry.measurement ?? getDefaultMeasurement(entry.food);
    return getCaloriesForMeasurement(entry.food, measurement, entry.servings);
  }

  if (entry.recipe) {
    const perServing = getRecipeCaloriesPerServing(entry.recipe);
    if (perServing == null) {
      return null;
    }
    return perServing * entry.servings;
  }

  return null;
};

export const formatEntryCalories = (entry: FoodEntry) => {
  const calories = getEntryCalories(entry);
  if (calories == null) {
    return '';
  }
  return formatCalories(calories);
};

export const getEntryNutritionTotals = (
  entry: FoodEntry,
): NutritionTotals | null => {
  if (entry.food) {
    const measurement =
      entry.measurement ?? getDefaultMeasurement(entry.food);
    const servings = Number(entry.servings);
    if (!Number.isFinite(servings) || servings <= 0) {
      return null;
    }
    return getFoodNutritionTotals(entry.food, measurement, servings);
  }

  if (entry.recipe) {
    if (!Array.isArray(entry.recipe.ingredients)) {
      return null;
    }
    const recipeServings = Number(entry.recipe.servings);
    if (!Number.isFinite(recipeServings) || recipeServings <= 0) {
      return null;
    }
    const entryServings = Number(entry.servings);
    if (!Number.isFinite(entryServings) || entryServings <= 0) {
      return null;
    }
    const recipeTotals = getIngredientNutritionTotals(
      entry.recipe.ingredients,
    );
    const factor = entryServings / recipeServings;
    return scaleNutritionTotals(recipeTotals, factor);
  }

  return null;
};

export const getEntriesNutritionTotals = (
  entries: FoodEntry[],
): NutritionTotals => {
  const totals: NutritionTotals = {};
  entries.forEach((entry) => {
    const entryTotals = getEntryNutritionTotals(entry);
    if (!entryTotals) {
      return;
    }
    addNutritionTotals(totals, entryTotals);
  });
  return totals;
};

export const buildEntryMacroRows = (
  totals: NutritionTotals,
  includeZero: boolean = true,
): NutritionRow[] =>
  buildMacroNutritionRowsFromTotals(totals, includeZero, false);

export const buildEntryNutritionRows = (
  totals: NutritionTotals,
  includeZero: boolean = true,
): NutritionRow[] => buildNutritionRowsFromTotals(totals, includeZero, false);
