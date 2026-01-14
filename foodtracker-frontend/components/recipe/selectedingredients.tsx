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
} from './recipe-utils';

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
    <View style={styles.selectedContainer}>
      <ThemedText style={styles.sectionTitle}>Selected ingredients</ThemedText>
      {ingredients.map((entry) => (
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
              <ThemedText style={styles.ingredientName}>
                {entry.food.name}
              </ThemedText>
              <ThemedText
                style={[styles.ingredientSubtext, { color: colors.icon }]}
              >
                {`${entry.servings} ${
                  entry.servings === 1 ? 'serving' : 'servings'
                } \u00b7 ${formatMeasurementText(
                  getMeasurementById(
                    entry.food,
                    entry.measurementId ?? null,
                  ) ?? getDefaultMeasurement(entry.food),
                )}`}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.ingredientCalories, { color: colors.text }]}
            >
              {formatCalories(
                getCaloriesForMeasurement(
                  entry.food,
                  getMeasurementById(entry.food, entry.measurementId ?? null) ??
                    getDefaultMeasurement(entry.food),
                  entry.servings,
                ),
              )}
            </ThemedText>
          </View>
        </TouchableOpacity>
      ))}
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
    padding: 12,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientInfo: {
    flex: 1,
    paddingRight: 12,
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
  },
});
