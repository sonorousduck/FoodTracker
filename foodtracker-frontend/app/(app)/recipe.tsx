import DuckTextInput from '@/components/interactions/inputs/textinput';
import CalorieSum, {
  CALORIE_SUM_HEIGHT,
} from '@/components/recipe/caloriesum';
import IngredientModal from '@/components/recipe/ingredientmodal';
import IngredientSearch from '@/components/recipe/ingredientsearch';
import SelectedIngredients from '@/components/recipe/selectedingredients';
import ThemedText from '@/components/themedtext';
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
import { isAxiosError } from '@/lib/api';
import { searchFoods } from '@/lib/api/food';
import { createRecipe, deleteRecipe, getRecipe, updateRecipe } from '@/lib/api/recipe';
import { Food } from '@/types/food/food';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const searchDelayMs = 350;
const minSearchLength = 2;

export default function Recipe() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation();
  const router = useRouter();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    servings?: string;
    ingredients?: string;
  }>({});

  const recipeIdValue = Array.isArray(id) ? id[0] : id;
  const recipeId = recipeIdValue ? Number(recipeIdValue) : null;
  const isEditing = Number.isFinite(recipeId);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (errors.title) {
        setErrors((prev) => ({ ...prev, title: undefined }));
      }
    },
    [errors.title],
  );

  const handleServingsChange = useCallback(
    (value: string) => {
      setServings(value);
      if (errors.servings) {
        setErrors((prev) => ({ ...prev, servings: undefined }));
      }
    },
    [errors.servings],
  );

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

  useEffect(() => {
    if (!isEditing || !recipeId) {
      return;
    }

    let isActive = true;
    const loadRecipe = async () => {
      setIsLoading(true);
      try {
        const recipe = await getRecipe(recipeId);
        if (!isActive) {
          return;
        }
        setTitle(recipe.title ?? '');
        setServings(String(recipe.servings ?? ''));
        const nextIngredients = recipe.ingredients
          .map((ingredient) => {
            if (!ingredient.food) {
              return null;
            }
            const servingsValue = Number(ingredient.servings);
            return {
              food: ingredient.food,
              servings: Number.isFinite(servingsValue)
                ? servingsValue
                : ingredient.servings,
              measurementId: ingredient.measurementId,
            };
          })
          .filter(
            (ingredient): ingredient is IngredientEntry => ingredient !== null,
          );
        setIngredients(nextIngredients);
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to load recipe.';
        Alert.alert('Error', message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadRecipe();

    return () => {
      isActive = false;
    };
  }, [isEditing, recipeId]);

  const validateInputs = useCallback(() => {
    const nextErrors: { title?: string; servings?: string; ingredients?: string } = {};

    if (!title.trim()) {
      nextErrors.title = 'Recipe name is required';
    }

    const parsedServings = Number(normalizeAmount(servings));
    if (!Number.isFinite(parsedServings) || parsedServings <= 0) {
      nextErrors.servings = 'Enter a valid serving count';
    }

    if (ingredients.length === 0) {
      nextErrors.ingredients = 'Add at least one ingredient';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [ingredients.length, servings, title]);

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
    setErrors((prev) => ({ ...prev, ingredients: undefined }));
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

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isLoading) {
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const servingCount = Number(normalizeAmount(servings));
      const payload = {
        title: title.trim(),
        servings: servingCount,
        ingredients: ingredients.map((entry) => ({
          foodId: entry.food.id,
          servings: entry.servings,
          measurementId: entry.measurementId ?? null,
        })),
      };

      if (isEditing && recipeId) {
        await updateRecipe(recipeId, payload);
        router.replace('/recipes');
      } else {
        await createRecipe(payload);
        router.replace('/recipes');
      }
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Failed to save recipe.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    ingredients,
    isEditing,
    isLoading,
    isSubmitting,
    recipeId,
    router,
    servings,
    title,
    validateInputs,
  ]);

  const handleDelete = useCallback(() => {
    if (!isEditing || !recipeId || isSubmitting) {
      return;
    }

    Alert.alert('Delete recipe?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            await deleteRecipe(recipeId);
            router.replace('/recipes');
          } catch (error) {
            const message = isAxiosError(error)
              ? error.response?.data?.message || error.message
              : 'Failed to delete recipe.';
            Alert.alert('Error', message);
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  }, [isEditing, isSubmitting, recipeId, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? 'Edit recipe' : 'Create recipe',
      headerRight: () => (
        <View style={styles.headerActions}>
          {isEditing && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isSubmitting || isLoading}
              testID="recipe-delete"
              activeOpacity={0.7}
              style={{
                opacity: isSubmitting || isLoading ? 0.4 : 1,
              }}
            >
              <MaterialIcons name="delete" size={24} color={colors.icon} />
            </TouchableOpacity>
          )}
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              testID="recipe-submit"
              activeOpacity={0.7}
              style={{ opacity: isLoading ? 0.4 : 1 }}
            >
              <AntDesign name="check-circle" size={24} color={colors.tint} />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [
    colors.icon,
    colors.tint,
    handleDelete,
    handleSubmit,
    isEditing,
    isLoading,
    isSubmitting,
    navigation,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DuckTextInput
          label="Recipe name"
          value={title}
          onChangeText={handleTitleChange}
          placeholder="Recipe name"
          enterKeyHint="next"
          error={errors.title}
          editable={!isSubmitting && !isLoading}
          testID="recipe-title-input"
        />
        <DuckTextInput
          label="Servings"
          value={servings}
          onChangeText={handleServingsChange}
          placeholder="Serves how many people?"
          enterKeyHint="done"
          inputMode="numeric"
          error={errors.servings}
          editable={!isSubmitting && !isLoading}
          testID="recipe-servings-input"
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
          {errors.ingredients ? (
            <View style={styles.errorRow}>
              <ThemedText style={styles.errorText}>
                {errors.ingredients}
              </ThemedText>
            </View>
          ) : null}

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorRow: {
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
  },
});
