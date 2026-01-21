import SelectedIngredientsList from '@/components/foodentry/selectedingredientslist';
import { IngredientEntry, RecipeColors } from './recipe-utils';

type SelectedIngredientsProps = {
  colors: RecipeColors;
  ingredients: IngredientEntry[];
  onSelectIngredient: (entry: IngredientEntry) => void;
};

export default function SelectedIngredients({
  colors,
  ingredients,
  onSelectIngredient,
}: SelectedIngredientsProps) {
  return (
    <SelectedIngredientsList
      colors={colors}
      ingredients={ingredients}
      onSelectIngredient={onSelectIngredient}
    />
  );
}
