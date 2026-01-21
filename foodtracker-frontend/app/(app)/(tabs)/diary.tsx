import {
  buildEntryMacroRows,
  buildEntryNutritionRows,
  formatEntryCalories,
  getEntriesNutritionTotals,
  getEntryCalories,
  getEntryServingsText,
  getEntryTitle,
  getMealTypeFromName,
  mealOrder,
} from '@/components/foodentry/foodentry-utils';
import FoodEntryModal from '@/components/foodentry/foodentrymodal';
import DayNutritionSection from '@/components/nutrition/dailynutritionsection';
import MealNutritionSection from '@/components/nutrition/mealnutritionsection';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { DefaultCalorieGoal } from '@/constants/goals';
import {
  deleteFoodEntry,
  getDiaryEntries,
  updateFoodEntry,
} from '@/lib/api/foodentry';
import { CurrentGoalsResponse, getCurrentGoals } from '@/lib/api/goal';
import { getRecipe } from '@/lib/api/recipe';
import { FoodEntry } from '@/types/foodentry/foodentry';
import { UpdateFoodEntryDto } from '@/types/foodentry/updatefoodentry';
import { GoalType } from '@/types/goal/goaltype';
import type { Recipe } from '@/types/recipe/recipe';
import { useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const WebDateInput = TextInput as unknown as React.ComponentType<
  ComponentProps<typeof TextInput> & { type?: string }
>;

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

export default function Tab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMacroExpanded, setIsMacroExpanded] = useState(false);
  const [showAllNutrients, setShowAllNutrients] = useState(false);
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false);
  const [goals, setGoals] = useState<CurrentGoalsResponse>({});
  const [isGoalsLoading, setIsGoalsLoading] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedMealNutrients, setExpandedMealNutrients] = useState<
    Record<string, boolean>
  >({});

  const loadEntries = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const response = await getDiaryEntries(startOfDay.toISOString());
      const recipeIds = Array.from(
        new Set(
          response
            .filter(
              (entry) =>
                entry.recipe && !Array.isArray(entry.recipe.ingredients),
            )
            .map((entry) => entry.recipe?.id)
            .filter((id): id is number => typeof id === 'number'),
        ),
      );

      let recipesById = new Map<number, Recipe>();
      if (recipeIds.length > 0) {
        const recipeResults = await Promise.allSettled(
          recipeIds.map((id) => getRecipe(id)),
        );
        recipesById = new Map(
          recipeResults
            .filter(
              (result): result is PromiseFulfilledResult<Recipe> =>
                result.status === 'fulfilled',
            )
            .map((result) => [result.value.id, result.value]),
        );
      }

      const hydratedEntries = response.map((entry) => {
        if (!entry.recipe) {
          return entry;
        }
        const hydratedRecipe = recipesById.get(entry.recipe.id);
        if (!hydratedRecipe) {
          return entry;
        }
        return { ...entry, recipe: hydratedRecipe };
      });

      setEntries(hydratedEntries);
    } catch (error) {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    setIsGoalsLoading(true);
    try {
      const response = await getCurrentGoals();
      setGoals(response);
    } catch (error) {
      setGoals({});
    } finally {
      setIsGoalsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries(selectedDate);
      loadGoals();
    }, [loadEntries, loadGoals, selectedDate]),
  );

  const totalCalories = useMemo(
    () =>
      entries.reduce((total, entry) => {
        const calories = getEntryCalories(entry);
        return total + (calories ?? 0);
      }, 0),
    [entries],
  );

  const groupedEntries = useMemo(
    () =>
      mealOrder.map((mealName) => ({
        mealName,
        entries: entries.filter((entry) => entry.meal?.name === mealName),
      })),
    [entries],
  );

  const mealCaloriesByName = useMemo(() => {
    const totals = new Map<string, number>();
    groupedEntries.forEach((section) => {
      const mealTotal = section.entries.reduce((total, entry) => {
        const calories = getEntryCalories(entry);
        return total + (calories ?? 0);
      }, 0);
      totals.set(section.mealName, mealTotal);
    });
    return totals;
  }, [groupedEntries]);

  const mealNutritionTotals = useMemo(
    () =>
      groupedEntries.map((section) => ({
        mealName: section.mealName,
        totals: getEntriesNutritionTotals(section.entries),
      })),
    [groupedEntries],
  );

  const dayNutritionTotals = useMemo(
    () => getEntriesNutritionTotals(entries),
    [entries],
  );

  const hasPercentGoals = Boolean(
    goals[GoalType.ProteinPercent] ||
    goals[GoalType.CarbohydratesPercent] ||
    goals[GoalType.FatPercent],
  );

  const calorieGoal = goals[GoalType.Calorie]?.value;
  const calorieGoalValue =
    calorieGoal ?? (hasPercentGoals ? DefaultCalorieGoal : undefined);
  const calorieDiff =
    calorieGoalValue != null ? calorieGoalValue - totalCalories : null;

  const getMacroGoalValue = useCallback(
    ({
      gramGoal,
      percentGoal,
      caloriesPerGram,
    }: {
      gramGoal?: number;
      percentGoal?: number;
      caloriesPerGram: number;
    }) => {
      if (gramGoal != null) {
        return gramGoal;
      }
      if (percentGoal == null) {
        return null;
      }
      const baseCalories = calorieGoalValue ?? DefaultCalorieGoal;
      return (baseCalories * (percentGoal / 100)) / caloriesPerGram;
    },
    [calorieGoalValue],
  );

  const macroGoals = useMemo(
    () => [
      {
        label: 'Protein',
        percent: goals[GoalType.ProteinPercent]?.value,
        goal: getMacroGoalValue({
          gramGoal: goals[GoalType.Protein]?.value,
          percentGoal: goals[GoalType.ProteinPercent]?.value,
          caloriesPerGram: 4,
        }),
        total: dayNutritionTotals.protein ?? 0,
      },
      {
        label: 'Carbs',
        percent: goals[GoalType.CarbohydratesPercent]?.value,
        goal: getMacroGoalValue({
          gramGoal: goals[GoalType.Carbohydrates]?.value,
          percentGoal: goals[GoalType.CarbohydratesPercent]?.value,
          caloriesPerGram: 4,
        }),
        total: dayNutritionTotals.carbs ?? 0,
      },
      {
        label: 'Fat',
        percent: goals[GoalType.FatPercent]?.value,
        goal: getMacroGoalValue({
          gramGoal: goals[GoalType.Fat]?.value,
          percentGoal: goals[GoalType.FatPercent]?.value,
          caloriesPerGram: 9,
        }),
        total: dayNutritionTotals.fat ?? 0,
      },
    ],
    [dayNutritionTotals, getMacroGoalValue, goals],
  );

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  const webDateValue = useMemo(
    () => formatDateInput(selectedDate),
    [selectedDate],
  );

  const goToPreviousDay = () => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1),
    );
  };

  const goToNextDay = () => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1),
    );
  };

  const toggleMacros = () => {
    setIsMacroExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setShowAllNutrients(false);
      }
      return next;
    });
  };

  const toggleGoals = () => {
    setIsGoalsExpanded((prev) => !prev);
  };

  const toggleMealMacros = (mealName: string) => {
    setExpandedMeals((prev) => {
      const next = !prev[mealName];
      if (!next) {
        setExpandedMealNutrients((current) => ({
          ...current,
          [mealName]: false,
        }));
      }
      return { ...prev, [mealName]: next };
    });
  };

  const openEditModal = (entry: FoodEntry) => {
    setSelectedEntry(entry);
    setIsModalVisible(true);
  };

  const handleUpdateEntry = async ({
    servings,
    mealType,
    measurementId,
  }: {
    servings: number;
    mealType: UpdateFoodEntryDto['mealType'];
    measurementId?: number;
    loggedAt?: Date;
  }) => {
    if (!selectedEntry) {
      return;
    }
    setIsSubmitting(true);
    try {
      await updateFoodEntry(selectedEntry.id, {
        servings,
        mealType,
        measurementId,
      });
      setIsModalVisible(false);
      setSelectedEntry(null);
      await loadEntries(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteFoodEntry(selectedEntry.id);
      setIsModalVisible(false);
      setSelectedEntry(null);
      await loadEntries(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Diary</ThemedText>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { borderColor: colors.modalSecondary },
              ]}
              onPress={goToPreviousDay}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateButtonText}>◀</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateDisplay,
                {
                  borderColor: colors.modalSecondary,
                  backgroundColor: colors.modal,
                },
              ]}
              onPress={() => setIsDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { borderColor: colors.modalSecondary },
              ]}
              onPress={goToNextDay}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateButtonText}>▶</ThemedText>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'web' && isDatePickerVisible ? (
            <View style={styles.webDatePicker}>
              <WebDateInput
                value={webDateValue}
                type="date"
                onChangeText={(value) => {
                  const parsed = parseDateInput(value);
                  if (parsed) {
                    setSelectedDate(parsed);
                    setIsDatePickerVisible(false);
                  }
                }}
                onChange={(event) => {
                  const nextValue =
                    (event as unknown as { target?: { value?: string } }).target
                      ?.value ??
                    (event as unknown as { nativeEvent?: { text?: string } })
                      .nativeEvent?.text;
                  if (nextValue) {
                    const parsed = parseDateInput(nextValue);
                    if (parsed) {
                      setSelectedDate(parsed);
                      setIsDatePickerVisible(false);
                    }
                  }
                }}
                style={[
                  styles.webDateInput,
                  {
                    borderColor: colors.modalSecondary,
                    color: colors.text,
                    backgroundColor: colors.modal,
                  },
                ]}
              />
            </View>
          ) : null}
          <View
            style={[
              styles.totalCard,
              {
                backgroundColor: colors.modal,
                borderColor: colors.modalSecondary,
              },
            ]}
          >
            <View style={styles.totalHeader}>
              <View>
                <ThemedText style={[styles.totalLabel, { color: colors.icon }]}>
                  Calories
                </ThemedText>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <ThemedText
                      style={[styles.summaryLabel, { color: colors.icon }]}
                    >
                      Goal
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {calorieGoalValue == null
                        ? 2000
                        : `${Math.round(calorieGoalValue)} cal`}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText
                      style={[styles.summaryLabel, { color: colors.icon }]}
                    >
                      Total
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {Math.round(totalCalories)} cal
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText
                      style={[styles.summaryLabel, { color: colors.icon }]}
                    >
                      Remaining
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {calorieDiff == null
                        ? '--'
                        : `${calorieDiff > 0 ? '' : '-'}${Math.round(
                            calorieDiff,
                          )} cal`}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.goalToggleRow}>
              <TouchableOpacity
                style={[
                  styles.goalToggleButton,
                  { borderColor: colors.modalSecondary },
                ]}
                onPress={toggleGoals}
                activeOpacity={0.7}
                testID="macro-goals-toggle"
              >
                <ThemedText
                  style={[styles.goalToggleText, { color: colors.text }]}
                >
                  {isGoalsExpanded ? 'Hide macro goals' : 'Show macro goals'}
                </ThemedText>
                <ThemedText
                  style={[styles.goalToggleText, { color: colors.text }]}
                >
                  {isGoalsExpanded ? '▲' : '▼'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {isGoalsExpanded ? (
              <View
                style={[
                  styles.goalCard,
                  { borderColor: colors.modalSecondary, marginBottom: 8 },
                ]}
              >
                <View style={styles.goalHeaderRow}>
                  <View style={styles.goalHeaderLabel} />
                  <ThemedText
                    style={[styles.goalHeaderText, { color: colors.icon }]}
                  >
                    Goal
                  </ThemedText>
                  <ThemedText
                    style={[styles.goalHeaderText, { color: colors.icon }]}
                  >
                    Total
                  </ThemedText>
                  <ThemedText
                    style={[styles.goalHeaderText, { color: colors.icon }]}
                  >
                    Remaining
                  </ThemedText>
                </View>
                {macroGoals.map((macro) => {
                  const goalValue =
                    macro.goal == null ? null : Math.round(macro.goal);
                  const totalValue = Math.round(macro.total);
                  const diffValue =
                    goalValue == null ? null : goalValue - totalValue;
                  const label =
                    macro.percent != null
                      ? `${macro.label} (${Math.round(macro.percent)}%)`
                      : macro.label;
                  return (
                    <View key={macro.label} style={styles.goalRow}>
                      <ThemedText style={styles.goalLabel}>{label}</ThemedText>
                      <ThemedText style={styles.goalValue}>
                        {goalValue == null ? '--' : `${goalValue} g`}
                      </ThemedText>
                      <ThemedText style={styles.goalValue}>
                        {totalValue} g
                      </ThemedText>
                      <ThemedText style={styles.goalValue}>
                        {diffValue == null
                          ? '--'
                          : `${diffValue > 0 ? '' : '-'}${diffValue} g`}
                      </ThemedText>
                    </View>
                  );
                })}
                {isGoalsLoading ? (
                  <View style={styles.goalLoading}>
                    <ActivityIndicator size="small" color={colors.tint} />
                  </View>
                ) : null}
              </View>
            ) : null}
            <DayNutritionSection
              title="Day total"
              rows={
                showAllNutrients
                  ? buildEntryNutritionRows(dayNutritionTotals)
                  : buildEntryMacroRows(dayNutritionTotals)
              }
              alternateBackground={colors.modalSecondary}
              isExpanded={isMacroExpanded}
              showAll={showAllNutrients}
              onToggleExpanded={toggleMacros}
              onToggleShowAll={() => setShowAllNutrients((prev) => !prev)}
              borderColor={colors.modalSecondary}
              textColor={colors.text}
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : (
          groupedEntries.map((section) => (
            <View key={section.mealName} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  {section.mealName}
                </ThemedText>
                <View style={styles.sectionActions}>
                  <ThemedText
                    style={[styles.sectionCount, { color: colors.icon }]}
                  >
                    {Math.round(mealCaloriesByName.get(section.mealName) ?? 0)}{' '}
                    cal
                  </ThemedText>
                </View>
              </View>
              {section.entries.length === 0 ? (
                <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                  Nothing logged yet.
                </ThemedText>
              ) : (
                section.entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      {
                        borderColor: colors.modalSecondary,
                        backgroundColor: colors.modal,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => openEditModal(entry)}
                    testID={`diary-item-${entry.id}`}
                  >
                    <View style={styles.entryRow}>
                      <View style={styles.entryInfo}>
                        <ThemedText style={styles.entryTitle}>
                          {getEntryTitle(entry)}
                        </ThemedText>
                        <ThemedText
                          style={[styles.entrySubtitle, { color: colors.icon }]}
                        >
                          {getEntryServingsText(entry)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.entryCalories}>
                        {formatEntryCalories(entry)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              )}
              {section.entries.length > 0 ? (
                <MealNutritionSection
                  title={undefined}
                  rows={
                    expandedMealNutrients[section.mealName]
                      ? buildEntryNutritionRows(
                          mealNutritionTotals.find(
                            (meal) => meal.mealName === section.mealName,
                          )?.totals ?? {},
                        )
                      : buildEntryMacroRows(
                          mealNutritionTotals.find(
                            (meal) => meal.mealName === section.mealName,
                          )?.totals ?? {},
                        )
                  }
                  alternateBackground={colors.modalSecondary}
                  isExpanded={Boolean(expandedMeals[section.mealName])}
                  showAll={Boolean(expandedMealNutrients[section.mealName])}
                  onToggleExpanded={() => toggleMealMacros(section.mealName)}
                  onToggleShowAll={() =>
                    setExpandedMealNutrients((prev) => ({
                      ...prev,
                      [section.mealName]: !prev[section.mealName],
                    }))
                  }
                  testIDPrefix={`diary-meal-${section.mealName.toLowerCase()}`}
                  borderColor={colors.modalSecondary}
                  textColor={colors.text}
                />
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
      <FoodEntryModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        onSubmit={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        showDelete
        food={selectedEntry?.food}
        recipe={selectedEntry?.recipe}
        initialMealType={getMealTypeFromName(selectedEntry?.meal?.name)}
        initialMeasurementId={selectedEntry?.measurement?.id ?? null}
        initialServings={selectedEntry?.servings ?? 1}
        submitLabel="Update"
        isSubmitting={isSubmitting}
        colors={colors}
      />
      {Platform.OS !== 'web' ? (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={selectedDate}
          onConfirm={(date) => {
            setSelectedDate(date);
            setIsDatePickerVisible(false);
          }}
          onCancel={() => setIsDatePickerVisible(false)}
        />
      ) : null}
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
    paddingBottom: 160,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  dateDisplay: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  webDatePicker: {
    alignSelf: 'flex-start',
  },
  webDateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  totalCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  summaryItem: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalToggleRow: {
    marginTop: 8,
    marginBottom: 8,
  },
  goalToggleButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    gap: 8,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalHeaderLabel: {
    flex: 1,
  },
  goalHeaderText: {
    flexBasis: 0,
    flexGrow: 1,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  goalValue: {
    flexBasis: 0,
    flexGrow: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  goalLoading: {
    paddingTop: 4,
    alignItems: 'center',
  },
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryInfo: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  entrySubtitle: {
    fontSize: 12,
  },
  entryCalories: {
    fontSize: 13,
    fontWeight: '700',
  },
});
