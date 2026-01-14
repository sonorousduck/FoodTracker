import DuckTextInput from '@/components/interactions/inputs/textinput';
import ThemedText from '@/components/themedtext';
import { Food } from '@/types/food/food';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  formatCalories,
  formatMeasurementText,
  getCaloriesForMeasurement,
  getDefaultMeasurement,
  RecipeColors,
} from './recipe-utils';

type IngredientSearchProps = {
  colors: RecipeColors;
  isAddingIngredient: boolean;
  minSearchLength: number;
  onSelectFood: (food: Food) => void;
  onToggleAdd: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  isSearching: boolean;
  searchResults: Food[];
};

export default function IngredientSearch({
  colors,
  isAddingIngredient,
  minSearchLength,
  onSelectFood,
  onToggleAdd,
  searchQuery,
  onSearchQueryChange,
  isSearching,
  searchResults,
}: IngredientSearchProps) {
  return (
    <View>
      <ThemedText style={styles.sectionTitle}>Ingredients</ThemedText>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={onToggleAdd}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.addButtonText}>
          {isAddingIngredient ? 'Hide ingredients' : 'Add ingredient'}
        </ThemedText>
      </TouchableOpacity>

      {isAddingIngredient && (
        <View style={styles.searchContainer}>
          <DuckTextInput
            label="Search ingredients"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder="Search ingredients"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect={false}
            testID="ingredient-search-input"
            containerStyle={styles.searchInputContainer}
          />

          {isSearching && (
            <ActivityIndicator color={colors.tint} size="small" />
          )}

          {!isSearching &&
            searchQuery.trim().length >= minSearchLength &&
            searchResults.length === 0 && (
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                No ingredients found.
              </ThemedText>
            )}

          {searchResults.map((result) => (
            <TouchableOpacity
              key={result.id}
              style={[
                styles.resultItem,
                {
                  borderColor: colors.modalSecondary,
                  backgroundColor: colors.modal,
                },
              ]}
              onPress={() => onSelectFood(result)}
              activeOpacity={0.7}
              testID={`search-result-${result.id}`}
            >
              <View style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <ThemedText style={styles.resultName}>
                    {result.name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.resultSubtext, { color: colors.icon }]}
                    testID={`search-result-subtext-${result.id}`}
                  >
                    {formatMeasurementText(getDefaultMeasurement(result))}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.resultCalories, { color: colors.text }]}
                  testID={`search-result-calories-${result.id}`}
                >
                  {formatCalories(
                    getCaloriesForMeasurement(
                      result,
                      getDefaultMeasurement(result),
                      1,
                    ),
                  )}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    marginTop: 12,
  },
  searchInputContainer: {
    marginBottom: 8,
  },
  resultItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultInfo: {
    flex: 1,
    paddingRight: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  resultCalories: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    marginBottom: 8,
  },
});
