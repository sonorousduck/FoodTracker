import CopyToDayModal from '@/components/foodentry/copytodaymodal';
import { getEntryServingsText, getEntryTitle, getMealTypeFromName } from '@/components/foodentry/foodentry-utils';
import FoodEntryModal from '@/components/foodentry/foodentrymodal';
import DuckTextInput from '@/components/interactions/inputs/textinput';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { createFoodEntry } from '@/lib/api/foodentry';
import { getFriendDiary, getFriendProfile, getFriendRecipes, importFriendRecipe } from '@/lib/api/friends';
import { FoodEntry } from '@/types/foodentry/foodentry';
import { MealType } from '@/types/foodentry/updatefoodentry';
import { FriendProfile } from '@/types/friends/friendprofile';
import { Recipe } from '@/types/recipe/recipe';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';


type LogAction = "log" | "copy-log";

export default function FriendDetail() {
  const params = useLocalSearchParams();
  const friendId = Number(params.id);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [activeView, setActiveView] = useState<"log" | "search">("log");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | undefined>(0);
  const [selectedServings, setSelectedServings] = useState(1);
  const [pendingAction, setPendingAction] = useState<LogAction>("log");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(new Set());
  const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
  const [isCopySubmitting, setIsCopySubmitting] = useState(false);

  const formattedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [selectedDate]
  );

  const loadFriend = useCallback(async () => {
    if (!Number.isFinite(friendId)) {
      return;
    }
    try {
      const response = await getFriendProfile(friendId);
      setFriend(response);
    } catch (error) {
      setFriend(null);
    }
  }, [friendId]);

  const loadDiary = useCallback(
    async (date: Date) => {
      if (!Number.isFinite(friendId)) {
        return;
      }
      setIsLoading(true);
      try {
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const response = await getFriendDiary(friendId, startOfDay.toISOString());
        setEntries(response);
      } catch (error) {
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    },
    [friendId]
  );

  useFocusEffect(
    useCallback(() => {
      loadFriend();
      loadDiary(selectedDate);
    }, [loadDiary, loadFriend, selectedDate])
  );

  const searchRecipes = useCallback(async () => {
    if (!Number.isFinite(friendId)) {
      return;
    }
    setIsRecipeLoading(true);
    try {
      const response = await getFriendRecipes({
        friendId,
        search: recipeQuery.trim(),
      });
      setRecipes(response);
    } catch (error) {
      setRecipes([]);
    } finally {
      setIsRecipeLoading(false);
    }
  }, [friendId, recipeQuery]);

  useEffect(() => {
    if (activeView === "search") {
      searchRecipes();
    }
  }, [activeView, searchRecipes]);

  const goToPreviousDay = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
  };

  const openLogModal = useCallback(
    ({
      recipe,
      action,
      initialMealType,
      initialServings,
    }: {
      recipe: Recipe;
      action: LogAction;
      initialMealType?: MealType;
      initialServings?: number;
    }) => {
      setSelectedRecipe(recipe);
      setPendingAction(action);
      setSelectedMealType(initialMealType ?? 0);
      setSelectedServings(initialServings ?? 1);
      setIsModalVisible(true);
    },
    []
  );

  const handleSubmit = async ({
    servings,
    mealType,
    loggedAt,
  }: {
    servings: number;
    mealType: MealType;
    loggedAt?: Date;
  }) => {
    if (!selectedRecipe || !Number.isFinite(friendId)) {
      return;
    }
    setIsSubmitting(true);
    try {
      let recipeId = selectedRecipe.id;
      if (pendingAction === "copy-log") {
        const copied = await importFriendRecipe(friendId, selectedRecipe.id);
        recipeId = copied.id;
      }
      await createFoodEntry({
        recipeId,
        mealType,
        servings,
        loggedAt,
      });
      setIsModalVisible(false);
      Alert.alert("Logged", "Added to your day.");
    } catch (error) {
      Alert.alert("Error", "Could not log this recipe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyDefaultMealType = useMemo(() => {
    const selected = entries.filter((e) => selectedEntryIds.has(e.id));
    const mealNames = new Set(selected.map((e) => e.meal?.name));
    if (mealNames.size === 1) {
      return getMealTypeFromName([...mealNames][0]);
    }
    return 0;
  }, [entries, selectedEntryIds]);

  const copyDefaultDate = useMemo(() => {
    return new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate() + 1,
    );
  }, [selectedDate]);

  const toggleEntrySelection = (id: number) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedEntryIds(new Set());
  };

  const handleCopyEntries = async (
    targetDate: Date,
    targetMealType: MealType,
  ) => {
    const selected = entries.filter((e) => selectedEntryIds.has(e.id));
    setIsCopySubmitting(true);
    try {
      await Promise.all(
        selected.map((entry) =>
          createFoodEntry({
            servings: entry.servings,
            mealType: targetMealType,
            foodId: entry.food?.id,
            recipeId: entry.recipe?.id,
            measurementId: entry.food ? entry.measurement?.id : undefined,
            loggedAt: targetDate,
          }),
        ),
      );
      setIsCopyModalVisible(false);
      exitSelectMode();
      Alert.alert("Copied", "Added to your day.");
    } catch (error) {
      Alert.alert("Error", "Could not copy entries.");
    } finally {
      setIsCopySubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{friend ? `${friend.firstName} ${friend.lastName}` : "Friend"}</ThemedText>
        {friend ? <ThemedText style={[styles.subtitle, { color: colors.icon }]}>{friend.email}</ThemedText> : null}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor: activeView === "log" ? colors.tint : colors.modalSecondary,
            },
          ]}
          onPress={() => setActiveView("log")}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.tabButtonText, { color: activeView === "log" ? "#FFFFFF" : colors.text }]}>
            Day log
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor: activeView === "search" ? colors.tint : colors.modalSecondary,
            },
          ]}
          onPress={() => setActiveView("search")}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.tabButtonText, { color: activeView === "search" ? "#FFFFFF" : colors.text }]}>
            Search recipes
          </ThemedText>
        </TouchableOpacity>
      </View>

      {activeView === "log" ? (
        <View style={styles.section}>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.modalSecondary }]}
              onPress={goToPreviousDay}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateButtonText}>◀</ThemedText>
            </TouchableOpacity>
            <View
              style={[
                styles.dateDisplay,
                {
                  borderColor: colors.modalSecondary,
                  backgroundColor: colors.modal,
                },
              ]}
            >
              <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.modalSecondary }]}
              onPress={goToNextDay}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateButtonText}>▶</ThemedText>
            </TouchableOpacity>
          </View>


          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : entries.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>No entries logged for this day.</ThemedText>
          ) : (
            entries.map((entry) => {
              const isSelected = selectedEntryIds.has(entry.id);
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.card,
                    {
                      borderColor: isSelected ? colors.tint : colors.modalSecondary,
                      backgroundColor: isSelected ? colors.modal : colors.modal,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (isSelectMode) {
                      toggleEntrySelection(entry.id);
                    } else if (entry.recipe) {
                      openLogModal({
                        recipe: entry.recipe as Recipe,
                        action: "log",
                        initialMealType: getMealTypeFromName(entry.meal?.name),
                        initialServings: entry.servings ?? 1,
                      });
                    }
                  }}
                  onLongPress={() => {
                    if (!isSelectMode) {
                      setIsSelectMode(true);
                      toggleEntrySelection(entry.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.cardTitle}>{getEntryTitle(entry)}</ThemedText>
                    <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
                      {entry.meal?.name ?? "Meal"} • {getEntryServingsText(entry)}
                    </ThemedText>
                  </View>
                  {entry.recipe && !isSelectMode ? (
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colors.modalSecondary }]}
                        onPress={() =>
                          openLogModal({
                            recipe: entry.recipe as Recipe,
                            action: "log",
                            initialMealType: getMealTypeFromName(entry.meal?.name),
                            initialServings: entry.servings ?? 1,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.secondaryButtonText}>Log to my day</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colors.modalSecondary }]}
                        onPress={() =>
                          openLogModal({
                            recipe: entry.recipe as Recipe,
                            action: "copy-log",
                            initialMealType: getMealTypeFromName(entry.meal?.name),
                            initialServings: entry.servings ?? 1,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.secondaryButtonText}>Save copy & log</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.searchRow}>
            <DuckTextInput
              label="Search recipes"
              value={recipeQuery}
              onChangeText={setRecipeQuery}
              onSubmitEditing={searchRecipes}
              returnKeyType="search"
              containerStyle={styles.searchInput}
              testID="friend-recipe-query"
            />
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint, opacity: isRecipeLoading ? 0.6 : 1 }]}
              onPress={searchRecipes}
              activeOpacity={0.8}
              disabled={isRecipeLoading}
              testID="friend-recipe-search"
            >
              {isRecipeLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>Search</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {isRecipeLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : recipes.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>No matching recipes.</ThemedText>
          ) : (
            recipes.map((recipe) => (
              <View
                key={recipe.id}
                style={[styles.card, { borderColor: colors.modalSecondary, backgroundColor: colors.modal }]}
              >
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>{recipe.title}</ThemedText>
                  <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
                    {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
                  </ThemedText>
                </View>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.modalSecondary }]}
                    onPress={() => openLogModal({ recipe, action: "log" })}
                    activeOpacity={0.7}
                    testID={`friend-recipe-log-${recipe.id}`}
                  >
                    <ThemedText style={styles.secondaryButtonText}>Log to my day</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.modalSecondary }]}
                    onPress={() => openLogModal({ recipe, action: "copy-log" })}
                    activeOpacity={0.7}
                    testID={`friend-recipe-copy-${recipe.id}`}
                  >
                    <ThemedText style={styles.secondaryButtonText}>Save copy & log</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}


      <CopyToDayModal
        visible={isCopyModalVisible}
        onDismiss={() => setIsCopyModalVisible(false)}
        onConfirm={handleCopyEntries}
        selectedCount={selectedEntryIds.size}
        defaultDate={copyDefaultDate}
        defaultMealType={copyDefaultMealType}
        isSubmitting={isCopySubmitting}
        colors={colors}
      />

      <FoodEntryModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
        recipe={selectedRecipe}
        initialMealType={selectedMealType}
        initialServings={selectedServings}
        initialDate={selectedDate}
        showDatePicker
        submitLabel="Log"
        isSubmitting={isSubmitting}
        colors={colors}
      />
      </ScrollView>

      {isSelectMode && selectedEntryIds.size > 0 && (
        <View style={[styles.selectionBar, { backgroundColor: colors.modal, borderTopColor: colors.modalSecondary }]}>
          <ThemedText style={styles.selectionBarText}>
            {selectedEntryIds.size} selected
          </ThemedText>
          <View style={styles.selectionBarButtons}>
            <TouchableOpacity
              style={[styles.selectionBarButton, { borderColor: colors.modalSecondary }]}
              onPress={exitSelectMode}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.selectionBarButtonText, { color: colors.text }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionBarButton, { backgroundColor: colors.tint }]}
              onPress={() => setIsCopyModalVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.selectionBarButtonText}>Copy</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 160,
    gap: 20,
  },
  header: {
    gap: 4,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    gap: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateDisplay: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 12,
  },
  loading: {
    paddingVertical: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  searchInput: {
    flex: 1,
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  selectionBar: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  selectionBarText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  selectionBarButtons: {
    flexDirection: "row",
    gap: 8,
  },
  selectionBarButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  selectionBarButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
