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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';


type LogAction = "log" | "copy-log";

export default function FriendDetail() {
  const params = useLocalSearchParams();
  const friendId = Number(params.id);
  const router = useRouter();
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

  useEffect(() => {
    if (activeView === "search") {
      searchRecipes();
    }
  }, [activeView, searchRecipes]);

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

  const recipeEntries = useMemo(() => entries.filter((entry) => entry.recipe), [entries]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.modalSecondary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="friend-back"
        >
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
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
          ) : recipeEntries.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>No recipes logged for this day.</ThemedText>
          ) : (
            recipeEntries.map((entry) => (
              <View
                key={entry.id}
                style={[styles.card, { borderColor: colors.modalSecondary, backgroundColor: colors.modal }]}
              >
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>{getEntryTitle(entry)}</ThemedText>
                  <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
                    {entry.meal?.name ?? "Meal"} • {getEntryServingsText(entry)}
                  </ThemedText>
                </View>
                {entry.recipe ? (
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
              </View>
            ))
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 160,
    gap: 20,
  },
  header: {
    gap: 4,
    paddingTop: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
});
