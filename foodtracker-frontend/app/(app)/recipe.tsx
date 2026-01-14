import DuckTextInput from '@/components/interactions/inputs/textinput';
import CalorieSum, {
  CALORIE_SUM_HEIGHT,
} from '@/components/recipe/caloriesum';
import IngredientModal from '@/components/recipe/ingredientmodal';
import IngredientSearch from '@/components/recipe/ingredientsearch';
import SelectedIngredients from '@/components/recipe/selectedingredients';
import {
  buildCoreNutritionRows,
  buildNutritionRows,
  getDefaultMeasurement,
  getFoodMeasurements,
  getCaloriesForMeasurement,
  getMeasurementById,
  IngredientEntry,
  normalizeAmount,
} from '@/components/recipe/recipe-utils';
import { Colors } from '@/constants/Colors';
import { searchFoods } from '@/lib/api/food';
import { Food } from '@/types/food/food';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const searchDelayMs = 350;
const minSearchLength = 2;

export default function Recipe() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('');
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<
    number | null
  >(null);
  const [servingInput, setServingInput] = useState('1');
  const [isIngredientModalVisible, setIsIngredientModalVisible] =
    useState(false);

  useEffect(() => {
    let isActive = true;
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < minSearchLength) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchFoods(trimmedQuery, 20);
        if (isActive) {
          setSearchResults(results);
        }
      } catch (error) {
        if (isActive) {
          setSearchResults([]);
        }
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, searchDelayMs);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const openIngredientModal = (food: Food, entry?: IngredientEntry) => {
    const measurement =
      entry?.measurementId !== undefined
        ? (getMeasurementById(food, entry.measurementId) ??
          getDefaultMeasurement(food))
        : getDefaultMeasurement(food);
    setSelectedFood(food);
    setSelectedMeasurementId(measurement?.id ?? null);
    setServingInput(entry ? String(entry.servings) : '1');
    setIsIngredientModalVisible(true);
  };

  const handleRemoveIngredient = (foodId: number) => {
    setIngredients((prev) => prev.filter((entry) => entry.food.id !== foodId));
  };

  const handleConfirmIngredient = () => {
    if (!selectedFood) {
      return;
    }
    const measurement =
      getMeasurementById(selectedFood, selectedMeasurementId) ??
      getDefaultMeasurement(selectedFood);
    const normalizedServings = normalizeAmount(servingInput);
    const parsedServings = Number(normalizedServings);
    const servingCount =
      Number.isFinite(parsedServings) && parsedServings > 0
        ? parsedServings
        : 1;
    setIngredients((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.food.id === selectedFood.id,
      );
      const updatedEntry: IngredientEntry = {
        food: selectedFood,
        servings: servingCount,
        measurementId: measurement?.id,
      };
      if (existingIndex === -1) {
        return [...prev, updatedEntry];
      }
      const next = [...prev];
      next[existingIndex] = updatedEntry;
      return next;
    });
    setSearchQuery('');
    setSearchResults([]);
    setIsIngredientModalVisible(false);
    setSelectedFood(null);
  };

  const handleCloseModal = () => {
    setIsIngredientModalVisible(false);
    setSelectedFood(null);
  };

  const selectedEntry = useMemo(() => {
    if (!selectedFood) {
      return undefined;
    }
    return ingredients.find((entry) => entry.food.id === selectedFood.id);
  }, [ingredients, selectedFood]);

  const selectedMeasurements = useMemo(
    () => (selectedFood ? getFoodMeasurements(selectedFood) : []),
    [selectedFood],
  );

  const selectedMeasurement = useMemo(() => {
    if (!selectedFood) {
      return undefined;
    }
    return (
      getMeasurementById(selectedFood, selectedMeasurementId) ??
      getDefaultMeasurement(selectedFood)
    );
  }, [selectedFood, selectedMeasurementId]);

  const modalServings = useMemo(() => {
    const parsed = Number(normalizeAmount(servingInput));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [servingInput]);

  const nutritionRows = useMemo(() => {
    if (!selectedFood) {
      return [];
    }
    return buildNutritionRows(selectedFood, selectedMeasurement, modalServings);
  }, [modalServings, selectedFood, selectedMeasurement]);

  const coreNutritionRows = useMemo(() => {
    if (!selectedFood) {
      return [];
    }
    return buildCoreNutritionRows(
      selectedFood,
      selectedMeasurement,
      modalServings,
    );
  }, [modalServings, selectedFood, selectedMeasurement]);

  const totalCalories = useMemo(
    () =>
      ingredients.reduce((total, entry) => {
        const measurement =
          getMeasurementById(entry.food, entry.measurementId ?? null) ??
          getDefaultMeasurement(entry.food);
        return (
          total +
          getCaloriesForMeasurement(entry.food, measurement, entry.servings)
        );
      }, 0),
    [ingredients],
  );

  const perServingCalories = useMemo(() => {
    const parsed = Number(normalizeAmount(servings));
    const servingCount = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    if (!servingCount) {
      return null;
    }
    return totalCalories / servingCount;
  }, [servings, totalCalories]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DuckTextInput
          label="Recipe name"
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe name"
          enterKeyHint="next"
        />
        <DuckTextInput
          label="Servings"
          value={servings}
          onChangeText={setServings}
          placeholder="Serves how many people?"
          enterKeyHint="done"
          inputMode="numeric"
        />

        <View style={styles.section}>
          <IngredientSearch
            colors={colors}
            isAddingIngredient={isAddingIngredient}
            minSearchLength={minSearchLength}
            onSelectFood={(food) => openIngredientModal(food)}
            onToggleAdd={() => setIsAddingIngredient((prev) => !prev)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            isSearching={isSearching}
            searchResults={searchResults}
          />

          {ingredients.length > 0 && (
            <SelectedIngredients
              colors={colors}
              ingredients={ingredients}
              onSelectIngredient={(entry) =>
                openIngredientModal(entry.food, entry)
              }
            />
          )}
        </View>
      </ScrollView>
      <CalorieSum
        colors={colors}
        totalCalories={totalCalories}
        perServingCalories={perServingCalories}
      />
      <IngredientModal
        colors={colors}
        visible={isIngredientModalVisible}
        selectedFood={selectedFood}
        selectedMeasurements={selectedMeasurements}
        selectedMeasurementId={selectedMeasurementId}
        onSelectMeasurementId={setSelectedMeasurementId}
        servingInput={servingInput}
        onServingInputChange={setServingInput}
        coreNutritionRows={coreNutritionRows}
        nutritionRows={nutritionRows}
        selectedEntry={selectedEntry}
        onRemove={() => {
          if (!selectedEntry) {
            return;
          }
          handleRemoveIngredient(selectedEntry.food.id);
          handleCloseModal();
        }}
        onConfirm={handleConfirmIngredient}
        onDismiss={handleCloseModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 4,
    paddingTop: 48,
    paddingHorizontal: 8,
    paddingBottom: CALORIE_SUM_HEIGHT + 24,
  },
  section: {
    marginTop: 8,
  },
});
