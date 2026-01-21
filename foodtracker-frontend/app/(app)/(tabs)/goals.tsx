import TextInputWithPrefixSuffix from '@/components/interactions/inputs/textinputwithprefixsuffix';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { DefaultCalorieGoal } from '@/constants/goals';
import { isAxiosError } from '@/lib/api';
import { getCurrentGoals, setNutritionGoals } from '@/lib/api/goal';
import { GoalType } from '@/types/goal/goaltype';
import { SetNutritionGoalsDto } from '@/types/goal/setnutritiongoals';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value?: number | null) =>
  value == null ? '' : String(value);

enum MacroMode {
  Grams = 'grams',
  Percent = 'percent',
}

export default function Tab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const toastOffset = insets.bottom + 24;
  const [macroMode, setMacroMode] = useState<MacroMode>(MacroMode.Grams);
  const [calorieGoal, setCalorieGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [carbGoal, setCarbGoal] = useState('');
  const [fatGoal, setFatGoal] = useState('');
  const [proteinPercent, setProteinPercent] = useState('');
  const [carbPercent, setCarbPercent] = useState('');
  const [fatPercent, setFatPercent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const goals = await getCurrentGoals();
      const calorieValue = goals[GoalType.Calorie]?.value;
      const proteinPercentValue = goals[GoalType.ProteinPercent]?.value;
      const carbPercentValue = goals[GoalType.CarbohydratesPercent]?.value;
      const fatPercentValue = goals[GoalType.FatPercent]?.value;
      const proteinGramValue = goals[GoalType.Protein]?.value;
      const carbGramValue = goals[GoalType.Carbohydrates]?.value;
      const fatGramValue = goals[GoalType.Fat]?.value;
      const hasPercentGoals =
        proteinPercentValue != null ||
        carbPercentValue != null ||
        fatPercentValue != null;
      setMacroMode(hasPercentGoals ? MacroMode.Percent : MacroMode.Grams);
      setCalorieGoal(formatNumber(calorieValue));
      setProteinPercent(formatNumber(proteinPercentValue));
      setCarbPercent(formatNumber(carbPercentValue));
      setFatPercent(formatNumber(fatPercentValue));
      setProteinGoal(formatNumber(proteinGramValue));
      setCarbGoal(formatNumber(carbGramValue));
      setFatGoal(formatNumber(fatGramValue));
      setErrors({});
    } catch (error) {
      setErrors({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals]),
  );

  const parsedCalories = useMemo(() => parseNumber(calorieGoal), [calorieGoal]);
  const caloriesForPercent = parsedCalories ?? DefaultCalorieGoal;
  const parsedProteinPercent = useMemo(
    () => parseNumber(proteinPercent),
    [proteinPercent],
  );
  const parsedCarbPercent = useMemo(
    () => parseNumber(carbPercent),
    [carbPercent],
  );
  const parsedFatPercent = useMemo(() => parseNumber(fatPercent), [fatPercent]);

  const percentTotal = useMemo(() => {
    if (
      parsedProteinPercent == null ||
      parsedCarbPercent == null ||
      parsedFatPercent == null
    ) {
      return null;
    }
    return parsedProteinPercent + parsedCarbPercent + parsedFatPercent;
  }, [parsedCarbPercent, parsedFatPercent, parsedProteinPercent]);

  const proteinGramsFromPercent = useMemo(() => {
    if (parsedProteinPercent == null) {
      return null;
    }
    return (caloriesForPercent * (parsedProteinPercent / 100)) / 4;
  }, [caloriesForPercent, parsedProteinPercent]);

  const carbGramsFromPercent = useMemo(() => {
    if (parsedCarbPercent == null) {
      return null;
    }
    return (caloriesForPercent * (parsedCarbPercent / 100)) / 4;
  }, [caloriesForPercent, parsedCarbPercent]);

  const fatGramsFromPercent = useMemo(() => {
    if (parsedFatPercent == null) {
      return null;
    }
    return (caloriesForPercent * (parsedFatPercent / 100)) / 9;
  }, [caloriesForPercent, parsedFatPercent]);

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const hasCalories = parseNumber(calorieGoal) != null;
    if (macroMode === MacroMode.Grams) {
      const proteinValue = parseNumber(proteinGoal);
      const carbValue = parseNumber(carbGoal);
      const fatValue = parseNumber(fatGoal);
      const hasAnyMacro =
        proteinGoal.trim() || carbGoal.trim() || fatGoal.trim();
      if (hasAnyMacro && proteinGoal.trim() && proteinValue == null) {
        nextErrors.proteinGoal = 'Enter protein grams';
      }
      if (hasAnyMacro && carbGoal.trim() && carbValue == null) {
        nextErrors.carbGoal = 'Enter carbs grams';
      }
      if (hasAnyMacro && fatGoal.trim() && fatValue == null) {
        nextErrors.fatGoal = 'Enter fat grams';
      }
      if (!hasAnyMacro && !hasCalories) {
        nextErrors.macroGoal = 'Set a calorie goal or at least one macro goal';
      }
    } else {
      const hasAnyPercent =
        proteinPercent.trim() || carbPercent.trim() || fatPercent.trim();
      if (hasAnyPercent) {
        if (parsedProteinPercent == null) {
          nextErrors.proteinPercent = 'Enter protein %';
        }
        if (parsedCarbPercent == null) {
          nextErrors.carbPercent = 'Enter carbs %';
        }
        if (parsedFatPercent == null) {
          nextErrors.fatPercent = 'Enter fat %';
        }
        if (percentTotal != null && Math.abs(percentTotal - 100) > 0.01) {
          nextErrors.percentTotal = 'Percentages must add up to 100';
        }
      } else if (!hasCalories) {
        nextErrors.macroGoal = 'Set a calorie goal or macro percentages';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    macroMode,
    carbGoal,
    fatGoal,
    calorieGoal,
    parsedCarbPercent,
    parsedFatPercent,
    parsedProteinPercent,
    percentTotal,
    proteinGoal,
    proteinPercent,
    carbPercent,
    fatPercent,
  ]);

  const handleSave = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    if (!validate()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: SetNutritionGoalsDto = {
        calorieGoal: parsedCalories ?? undefined,
        proteinGoal:
          macroMode === MacroMode.Grams
            ? (parseNumber(proteinGoal) ?? undefined)
            : undefined,
        carbsGoal:
          macroMode === MacroMode.Grams
            ? (parseNumber(carbGoal) ?? undefined)
            : undefined,
        fatGoal:
          macroMode === MacroMode.Grams
            ? (parseNumber(fatGoal) ?? undefined)
            : undefined,
        proteinPercent:
          macroMode === MacroMode.Percent
            ? (parsedProteinPercent ?? undefined)
            : undefined,
        carbsPercent:
          macroMode === MacroMode.Percent
            ? (parsedCarbPercent ?? undefined)
            : undefined,
        fatPercent:
          macroMode === MacroMode.Percent
            ? (parsedFatPercent ?? undefined)
            : undefined,
      };

      await setNutritionGoals(payload);
      await loadGoals();
      setShowToast(true);
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Failed to save goals';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    carbGoal,
    fatGoal,
    isSubmitting,
    loadGoals,
    macroMode,
    parsedCalories,
    parsedCarbPercent,
    parsedFatPercent,
    parsedProteinPercent,
    proteinGoal,
    validate,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Goals</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Set daily calorie and macro goals.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Calories</ThemedText>
          <TextInputWithPrefixSuffix
            label="Calorie goal"
            value={calorieGoal}
            onChangeText={setCalorieGoal}
            placeholder="2000"
            unit="cal"
            inputMode="decimal"
            keyboardType="decimal-pad"
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Macros</ThemedText>
            <View style={styles.modeToggle}>
              {[MacroMode.Grams, MacroMode.Percent].map((mode) => {
                const isActive = macroMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => {
                      setMacroMode(mode);
                      setErrors({});
                    }}
                    activeOpacity={0.7}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: isActive ? colors.tint : colors.modal,
                        borderColor: colors.modalSecondary,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.modeButtonText,
                        { color: isActive ? colors.card : colors.text },
                      ]}
                    >
                      {mode === MacroMode.Grams ? 'Grams' : 'Percent'}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {macroMode === MacroMode.Grams ? (
            <View style={styles.macroInputs}>
              <TextInputWithPrefixSuffix
                label="Protein"
                value={proteinGoal}
                onChangeText={setProteinGoal}
                placeholder="150"
                unit="g"
                error={errors.proteinGoal}
                inputMode="decimal"
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
              <TextInputWithPrefixSuffix
                label="Carbs"
                value={carbGoal}
                onChangeText={setCarbGoal}
                placeholder="200"
                unit="g"
                error={errors.carbGoal}
                inputMode="decimal"
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
              <TextInputWithPrefixSuffix
                label="Fat"
                value={fatGoal}
                onChangeText={setFatGoal}
                placeholder="70"
                unit="g"
                error={errors.fatGoal}
                inputMode="decimal"
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
              {errors.macroGoal ? (
                <ThemedText style={[styles.errorText, { color: '#FF3B30' }]}>
                  {errors.macroGoal}
                </ThemedText>
              ) : null}
            </View>
          ) : (
            <View style={styles.macroInputs}>
              <View style={styles.percentRow}>
                <TextInputWithPrefixSuffix
                  label="Protein"
                  value={proteinPercent}
                  onChangeText={setProteinPercent}
                  placeholder="30"
                  unit="%"
                  error={errors.proteinPercent}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
                <ThemedText
                  style={[styles.estimateText, { color: colors.icon }]}
                >
                  {proteinGramsFromPercent == null
                    ? 'Est. -- g'
                    : `Est. ${Math.round(proteinGramsFromPercent)} g`}
                </ThemedText>
              </View>
              <View style={styles.percentRow}>
                <TextInputWithPrefixSuffix
                  label="Carbs"
                  value={carbPercent}
                  onChangeText={setCarbPercent}
                  placeholder="40"
                  unit="%"
                  error={errors.carbPercent}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
                <ThemedText
                  style={[styles.estimateText, { color: colors.icon }]}
                >
                  {carbGramsFromPercent == null
                    ? 'Est. -- g'
                    : `Est. ${Math.round(carbGramsFromPercent)} g`}
                </ThemedText>
              </View>
              <View style={styles.percentRow}>
                <TextInputWithPrefixSuffix
                  label="Fat"
                  value={fatPercent}
                  onChangeText={setFatPercent}
                  placeholder="30"
                  unit="%"
                  error={errors.fatPercent}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
                <ThemedText
                  style={[styles.estimateText, { color: colors.icon }]}
                >
                  {fatGramsFromPercent == null
                    ? 'Est. -- g'
                    : `Est. ${Math.round(fatGramsFromPercent)} g`}
                </ThemedText>
              </View>
              {percentTotal != null ? (
                <ThemedText
                  style={[
                    styles.percentTotal,
                    { color: errors.percentTotal ? '#FF3B30' : colors.icon },
                  ]}
                >
                  Total: {Math.round(percentTotal)}%
                </ThemedText>
              ) : null}
              {errors.percentTotal ? (
                <ThemedText style={[styles.errorText, { color: '#FF3B30' }]}>
                  {errors.percentTotal}
                </ThemedText>
              ) : null}
              {errors.macroGoal ? (
                <ThemedText style={[styles.errorText, { color: '#FF3B30' }]}>
                  {errors.macroGoal}
                </ThemedText>
              ) : null}
              <ThemedText style={[styles.helperText, { color: colors.icon }]}>
                Based on {parsedCalories ?? DefaultCalorieGoal} cal
              </ThemedText>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.tint,
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.8}
          testID="goals-save"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.card} />
          ) : (
            <ThemedText style={[styles.saveButtonText, { color: colors.card }]}>
              Save goals
            </ThemedText>
          )}
        </TouchableOpacity>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : null}
      </ScrollView>
      <Snackbar
        visible={showToast}
        onDismiss={() => setShowToast(false)}
        duration={2200}
        style={{ marginBottom: toastOffset }}
        contentStyle={{ alignItems: 'center' }}
      >
        <ThemedText style={{ color: colors.text, textAlign: 'center' }}>
          ✅ Goals saved
        </ThemedText>
      </Snackbar>
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
    gap: 20,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  macroInputs: {
    gap: 10,
  },
  percentRow: {
    gap: 6,
  },
  estimateText: {
    fontSize: 11,
  },
  percentTotal: {
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    alignItems: 'center',
  },
});
