import {
  formatEntryCalories,
  getEntryServingsText,
  getEntryTitle,
  getMealTypeFromName,
  getRecipeCaloriesPerServing,
} from "@/components/foodentry/foodentry-utils";
import FoodEntryModal from "@/components/foodentry/foodentrymodal";
import DuckTextInput from "@/components/interactions/inputs/textinput";
import {
  formatCalories,
  formatMeasurementText,
  getCaloriesForMeasurement,
  getDefaultMeasurement,
} from "@/components/recipe/recipe-utils";
import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import { isAxiosError } from "@/lib/api";
import { searchFoods } from "@/lib/api/food";
import {
  createFoodEntry,
  getFoodEntryHistory,
} from "@/lib/api/foodentry";
import { getRecipes } from "@/lib/api/recipe";
import { Food } from "@/types/food/food";
import { FoodEntry } from "@/types/foodentry/foodentry";
import { MealType } from "@/types/foodentry/updatefoodentry";
import { Recipe } from "@/types/recipe/recipe";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const searchDelayMs = 350;
const minSearchLength = 2;
const historyLimit = 20;

type TabKey = "all" | "recipes";
type SortOption = "recent" | "alpha" | "meal";

export default function LogFood() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<FoodEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(0);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<number | null>(null);
  const [selectedServings, setSelectedServings] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const entries = await getFoodEntryHistory({ limit: historyLimit });
      setHistoryEntries(entries);
    } catch (error) {
      setHistoryEntries([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const loadRecipes = useCallback(async () => {
    setIsRecipeLoading(true);
    try {
      const results = await getRecipes({ limit: 50 });
      setAllRecipes(results);
    } catch (error) {
      setAllRecipes([]);
    } finally {
      setIsRecipeLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      if (activeTab === "recipes" && searchQuery.trim().length < minSearchLength) {
        loadRecipes();
      }
    }, [activeTab, loadHistory, loadRecipes, searchQuery])
  );

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < minSearchLength) {
      setFoodResults([]);
      setRecipeResults([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      Promise.all([searchFoods(query, 20), getRecipes({ search: query, limit: 20 })])
        .then(([foods, recipes]) => {
          if (!isActive) {
            return;
          }
          setFoodResults(foods);
          setRecipeResults(recipes);
        })
        .catch(() => {
          if (!isActive) {
            return;
          }
          setFoodResults([]);
          setRecipeResults([]);
        })
        .finally(() => {
          if (isActive) {
            setIsSearching(false);
          }
        });
    }, searchDelayMs);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab !== "recipes") {
      return;
    }
    if (searchQuery.trim().length >= minSearchLength) {
      return;
    }
    loadRecipes();
  }, [activeTab, loadRecipes, searchQuery]);

  const dedupedHistory = useMemo(() => {
    const dedupedMap = new Map<string, FoodEntry>();
    const nonFoodEntries: FoodEntry[] = [];

    historyEntries.forEach((entry) => {
      if (!entry.food) {
        nonFoodEntries.push(entry);
        return;
      }
      const key = `food:${entry.food.id}:${entry.servings}`;
      const existing = dedupedMap.get(key);
      if (!existing) {
        dedupedMap.set(key, entry);
        return;
      }
      const existingDate = new Date(existing.loggedAt).getTime();
      const nextDate = new Date(entry.loggedAt).getTime();
      if (nextDate > existingDate) {
        dedupedMap.set(key, entry);
      }
    });

    return [...dedupedMap.values(), ...nonFoodEntries];
  }, [historyEntries]);

  const sortedHistory = useMemo(() => {
    const next = [...dedupedHistory];
    if (sortOption === "alpha") {
      return next.sort((a, b) => getEntryTitle(a).localeCompare(getEntryTitle(b)));
    }
    if (sortOption === "meal") {
      return next.sort((a, b) => {
        const mealA = a.meal?.name ?? "";
        const mealB = b.meal?.name ?? "";
        const indexA = getMealTypeFromName(mealA);
        const indexB = getMealTypeFromName(mealB);
        if (indexA !== indexB) {
          return indexA - indexB;
        }
        return getEntryTitle(a).localeCompare(getEntryTitle(b));
      });
    }
    return next.sort(
      (a, b) =>
        new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );
  }, [dedupedHistory, sortOption]);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sortedHistory;
    }
    return sortedHistory.filter((entry) => {
      const title = getEntryTitle(entry).toLowerCase();
      const mealName = (entry.meal?.name ?? "").toLowerCase();
      return title.includes(query) || mealName.includes(query);
    });
  }, [searchQuery, sortedHistory]);

  const openFoodModal = ({
    food,
    mealName,
    servings,
    measurementId,
  }: {
    food: Food;
    mealName?: string;
    servings?: number;
    measurementId?: number | null;
  }) => {
    setSelectedRecipe(null);
    setSelectedFood(food);
    const defaultMeasurement = getDefaultMeasurement(food);
    setSelectedMeasurementId(
      measurementId ?? defaultMeasurement?.id ?? null
    );
    setSelectedServings(servings ?? 1);
    setSelectedMealType(getMealTypeFromName(mealName));
    setIsModalVisible(true);
  };

  const openRecipeModal = ({
    recipe,
    mealName,
    servings,
  }: {
    recipe: Recipe;
    mealName?: string;
    servings?: number;
  }) => {
    setSelectedFood(null);
    setSelectedRecipe(recipe);
    setSelectedMeasurementId(null);
    setSelectedServings(servings ?? 1);
    setSelectedMealType(getMealTypeFromName(mealName));
    setIsModalVisible(true);
  };

  const handleHistoryPress = (entry: FoodEntry) => {
    const mealName = entry.meal?.name ?? "Breakfast";
    if (entry.food) {
      openFoodModal({
        food: entry.food,
        mealName,
        servings: entry.servings,
        measurementId: entry.measurement?.id ?? null,
      });
    } else if (entry.recipe) {
      openRecipeModal({
        recipe: entry.recipe,
        mealName,
        servings: entry.servings,
      });
    }
  };

  const handleConfirmLog = async ({
    servings,
    mealType,
    measurementId,
    loggedAt,
  }: {
    servings: number;
    mealType: number;
    measurementId?: number;
    loggedAt?: Date;
  }) => {
    if (!selectedFood && !selectedRecipe) {
      return;
    }
    setIsSubmitting(true);
    try {
      const targetDate = loggedAt ?? new Date();
      const logDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );
      await createFoodEntry({
        servings,
        mealType,
        foodId: selectedFood?.id,
        recipeId: selectedRecipe?.id,
        measurementId: selectedFood ? measurementId ?? undefined : undefined,
        loggedAt: logDate,
      });
      setIsModalVisible(false);
      setSelectedFood(null);
      setSelectedRecipe(null);
      setSelectedMeasurementId(null);
      setSelectedServings(1);
      router.replace("/diary");
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to log food.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowSearchResults = searchQuery.trim().length >= minSearchLength;
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const recipeList =
    shouldShowSearchResults || activeTab === "all" ? recipeResults : allRecipes;
  const filteredRecipes =
    activeTab === "recipes" && trimmedQuery
      ? recipeList.filter((recipe) =>
          recipe.title.toLowerCase().includes(trimmedQuery)
        )
      : recipeList;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Log food</ThemedText>
          <DuckTextInput
            label="Search foods"
            placeholder="Search foods"
            value={searchQuery}
            onChangeText={setSearchQuery}
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect={false}
            testID="logfood-search-input"
          />
          <View style={styles.tabs}>
            {(["all", "recipes"] as TabKey[]).map((tab) => {
              const isActive = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor: isActive
                        ? colors.tint
                        : colors.modalSecondary,
                    },
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                  testID={`logfood-tab-${tab}`}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      { color: isActive ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {tab === "all" ? "All" : "My Recipes"}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {activeTab === "all" ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>History</ThemedText>
                <View style={styles.sortRow}>
                  {([
                    { key: "recent", label: "Recent" },
                    { key: "alpha", label: "A-Z" },
                    { key: "meal", label: "Meal" },
                  ] as const).map((option) => {
                    const isActive = sortOption === option.key;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.sortChip,
                          {
                            backgroundColor: isActive
                              ? colors.tint
                              : colors.modalSecondary,
                          },
                        ]}
                        onPress={() => setSortOption(option.key)}
                        activeOpacity={0.8}
                      >
                        <ThemedText
                          style={[
                            styles.sortText,
                            { color: isActive ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {isHistoryLoading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="small" color={colors.tint} />
                </View>
              ) : filteredHistory.length === 0 ? (
                <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                  {searchQuery.trim()
                    ? "No matching history items."
                    : "No history yet. Log something to get started."}
                </ThemedText>
              ) : (
                filteredHistory.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.card,
                      {
                        borderColor: colors.modalSecondary,
                        backgroundColor: colors.modal,
                      },
                    ]}
                    onPress={() => handleHistoryPress(entry)}
                    activeOpacity={0.7}
                    testID={`history-item-${entry.id}`}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardText}>
                        <ThemedText style={styles.cardTitle}>
                          {getEntryTitle(entry)}
                        </ThemedText>
                        <ThemedText
                          style={[styles.cardSubtitle, { color: colors.icon }]}
                        >
                          {getEntryServingsText(entry)} ·{" "}
                          {entry.meal?.name ?? "Meal"}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.cardCalories}>
                        {formatEntryCalories(entry)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {shouldShowSearchResults ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>
                    Food from database
                  </ThemedText>
                </View>
                {isSearching ? (
                  <View style={styles.loading}>
                    <ActivityIndicator size="small" color={colors.tint} />
                  </View>
                ) : foodResults.length === 0 ? (
                  <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                    No foods found.
                  </ThemedText>
                ) : (
                  foodResults.map((food) => {
                    const measurement = getDefaultMeasurement(food);
                    return (
                      <TouchableOpacity
                        key={food.id}
                        style={[
                          styles.card,
                          {
                            borderColor: colors.modalSecondary,
                            backgroundColor: colors.modal,
                          },
                        ]}
                        onPress={() => openFoodModal({ food })}
                        activeOpacity={0.7}
                        testID={`food-result-${food.id}`}
                      >
                        <View style={styles.cardRow}>
                          <View style={styles.cardText}>
                            <ThemedText style={styles.cardTitle}>
                              {food.name}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.cardSubtitle,
                                { color: colors.icon },
                              ]}
                            >
                              {formatMeasurementText(measurement)}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.cardCalories}>
                            {formatCalories(
                              getCaloriesForMeasurement(food, measurement, 1)
                            )}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}

            {shouldShowSearchResults ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>
                    Your recipes
                  </ThemedText>
                </View>
                {isSearching ? (
                  <View style={styles.loading}>
                    <ActivityIndicator size="small" color={colors.tint} />
                  </View>
                ) : recipeResults.length === 0 ? (
                  <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                    No recipes found.
                  </ThemedText>
                ) : (
                  recipeResults.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={[
                        styles.card,
                        {
                          borderColor: colors.modalSecondary,
                          backgroundColor: colors.modal,
                        },
                      ]}
                      onPress={() => openRecipeModal({ recipe })}
                      activeOpacity={0.7}
                      testID={`recipe-result-${recipe.id}`}
                    >
                      <View style={styles.cardRow}>
                        <View style={styles.cardText}>
                          <ThemedText style={styles.cardTitle}>
                            {recipe.title}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.cardSubtitle,
                              { color: colors.icon },
                            ]}
                          >
                            {recipe.servings}{" "}
                            {recipe.servings === 1 ? "serving" : "servings"}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.cardCalories}>
                          {getRecipeCaloriesPerServing(recipe) == null
                            ? ""
                            : formatCalories(
                                getRecipeCaloriesPerServing(recipe) as number
                              )}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>My recipes</ThemedText>
            </View>
            {isRecipeLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            ) : filteredRecipes.length === 0 ? (
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                {trimmedQuery ? "No matching recipes." : "No recipes yet."}
              </ThemedText>
            ) : (
              filteredRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={[
                    styles.card,
                    {
                      borderColor: colors.modalSecondary,
                      backgroundColor: colors.modal,
                    },
                  ]}
                  onPress={() => openRecipeModal({ recipe })}
                  activeOpacity={0.7}
                  testID={`recipes-tab-item-${recipe.id}`}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardText}>
                      <ThemedText style={styles.cardTitle}>
                        {recipe.title}
                      </ThemedText>
                      <ThemedText
                        style={[styles.cardSubtitle, { color: colors.icon }]}
                      >
                        {recipe.servings}{" "}
                        {recipe.servings === 1 ? "serving" : "servings"}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.cardCalories}>
                      {getRecipeCaloriesPerServing(recipe) == null
                        ? ""
                        : formatCalories(
                            getRecipeCaloriesPerServing(recipe) as number
                          )}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <FoodEntryModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        onSubmit={handleConfirmLog}
        food={selectedFood}
        recipe={selectedRecipe}
        initialMealType={selectedMealType}
        initialMeasurementId={selectedMeasurementId}
        initialServings={selectedServings}
        initialDate={new Date()}
        showDatePicker
        submitLabel="Log"
        isSubmitting={isSubmitting}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sortRow: {
    flexDirection: "row",
    gap: 6,
  },
  sortChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 12,
  },
  loading: {
    paddingVertical: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardText: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 12,
  },
  cardCalories: {
    fontSize: 13,
    fontWeight: "700",
  },
});
