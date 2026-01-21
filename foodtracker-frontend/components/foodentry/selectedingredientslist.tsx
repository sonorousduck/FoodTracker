import ThemedText from '@/components/themedtext';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import {
  formatCalories,
  formatMeasurementText,
  getCaloriesForMeasurement,
  getDefaultMeasurement,
  getMeasurementById,
  IngredientEntry,
  RecipeColors,
} from '@/components/recipe/recipe-utils';

type SelectedIngredientsListProps = {
  colors: RecipeColors;
  ingredients: IngredientEntry[];
  onSelectIngredient: (entry: IngredientEntry) => void;
  title?: string;
};

export default function SelectedIngredientsList({
  colors,
  ingredients,
  onSelectIngredient,
  title = 'Selected ingredients',
}: SelectedIngredientsListProps) {
  return (
    <View style={styles.selectedContainer}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {ingredients.map((entry) => {
        const measurement =
          getMeasurementById(entry.food, entry.measurementId ?? null) ??
          getDefaultMeasurement(entry.food);
        const calories = getCaloriesForMeasurement(
          entry.food,
          measurement,
          entry.servings,
        );
        return (
          <TouchableOpacity
            key={entry.food.id}
            style={[
              styles.ingredientCard,
              {
                borderColor: colors.modalSecondary,
                backgroundColor: colors.modal,
              },
            ]}
            onPress={() => onSelectIngredient(entry)}
            activeOpacity={0.7}
            testID={`selected-ingredient-${entry.food.id}`}
          >
            <View style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <ThemedText
                  style={styles.ingredientName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {entry.food.name}
                </ThemedText>
                <ThemedText
                  style={[styles.ingredientSubtext, { color: colors.icon }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {`${entry.servings} ${
                    entry.servings === 1 ? 'serving' : 'servings'
                  } \u00b7 ${formatMeasurementText(measurement)}`}
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.ingredientCalories, { color: colors.text }]}
              >
                {formatCalories(calories)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  selectedContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  ingredientCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientInfo: {
    flex: 1,
    marginRight: 12,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ingredientSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  ingredientCalories: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 64,
  },
});
