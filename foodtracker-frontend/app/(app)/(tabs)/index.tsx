import {
  getEntryCalories,
} from '@/components/foodentry/foodentry-utils';
import CalorieProgress from '@/components/calorieprogress';
import ThemedText from '@/components/themedtext';
import WeightCardDisplay from '@/components/weightcarddisplay';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getDiaryEntries } from '@/lib/api/foodentry';
import { getCurrentGoals } from '@/lib/api/goal';
import { GoalType } from '@/types/goal/goaltype';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Card, Snackbar } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type ToastType = 'success' | 'error';

const SEMI_CIRCLE_SIZE = 220;
const STROKE_WIDTH = 18;

export default function Tab() {
  const { toast, toastType } = useLocalSearchParams<{
    toast?: string;
    toastType?: string;
  }>();
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [toastKind, setToastKind] = useState<ToastType>('success');
  const [isLoadingCalories, setIsLoadingCalories] = useState(false);
  const [totalCaloriesEaten, setTotalCaloriesEaten] = useState(0);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const toastOffset = insets.bottom + 64;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const toastMessage = Array.isArray(toast) ? toast[0] : toast;
  const toastTypeValue = Array.isArray(toastType) ? toastType[0] : toastType;

  useFocusEffect(
    useCallback(() => {
      if (!toastMessage) {
        return;
      }

      setToastText(toastMessage);
      setToastKind(toastTypeValue === 'error' ? 'error' : 'success');
      setShowToast(true);
      router.setParams({ toast: undefined, toastType: undefined });
    }, [toastMessage, toastTypeValue, router]),
  );

  const loadCaloriesAndGoals = useCallback(async () => {
    setIsLoadingCalories(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const [entries, goals] = await Promise.all([
        getDiaryEntries(startOfDay.toISOString()),
        getCurrentGoals(),
      ]);
      const calories = entries.reduce((sum, entry) => {
        const value = getEntryCalories(entry);
        return sum + (value ?? 0);
      }, 0);
      const calorieGoalValue = goals[GoalType.Calorie]?.value;
      setTotalCaloriesEaten(calories);
      setDailyCalorieGoal(
        calorieGoalValue != null && calorieGoalValue > 0 ? calorieGoalValue : null,
      );
    } catch (error) {
      setTotalCaloriesEaten(0);
      setDailyCalorieGoal(null);
    } finally {
      setIsLoadingCalories(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCaloriesAndGoals();
    }, [loadCaloriesAndGoals]),
  );

  const chartColors = useMemo(
    () => ({
      eaten: colorScheme === 'dark' ? '#ECEDEE' : '#26667F',
      over: '#D93025',
      remaining:
        colorScheme === 'dark'
          ? 'rgba(236, 237, 238, 0.25)'
          : 'rgba(38, 102, 127, 0.24)',
    }),
    [colorScheme],
  );

  const progress = useMemo(() => {
    if (!dailyCalorieGoal || dailyCalorieGoal <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(totalCaloriesEaten / dailyCalorieGoal, 1));
  }, [dailyCalorieGoal, totalCaloriesEaten]);

  const calorieDelta = useMemo(() => {
    if (!dailyCalorieGoal) {
      return 0;
    }
    return dailyCalorieGoal - totalCaloriesEaten;
  }, [dailyCalorieGoal, totalCaloriesEaten]);
  const isOverGoal = calorieDelta < 0;
  const remainingCalories = Math.max(calorieDelta, 0);
  const overCalories = Math.abs(Math.min(calorieDelta, 0));

  const toastEmoji = toastKind === 'error' ? '❌' : '✅';

  return (
    <SafeAreaView style={styles.container}>
      <Card mode="elevated" style={styles.calorieCard}>
        <View style={styles.calorieCardContent}>
        <ThemedText style={styles.cardTitle}>Daily Calories</ThemedText>
        {isLoadingCalories ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : dailyCalorieGoal == null ? (
          <View style={styles.zeroState}>
            <ThemedText style={styles.zeroStateText}>
              Set a calorie goal to track progress for the day.
            </ThemedText>
            <Pressable
              style={[styles.goalButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/goals')}
              testID="dashboard-goals-cta"
            >
              <ThemedText style={styles.goalButtonText}>Set goals</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.chartSection}>
            <CalorieProgress
              size={SEMI_CIRCLE_SIZE}
              strokeWidth={STROKE_WIDTH}
              progress={progress}
              trackColor={chartColors.remaining}
              progressColor={isOverGoal ? chartColors.over : chartColors.eaten}
              testID="dashboard-calorie-chart"
            />
            <View style={styles.summaryContainer}>
              <ThemedText style={styles.summaryMain} testID="dashboard-calorie-summary">
                {Math.round(totalCaloriesEaten)} / {Math.round(dailyCalorieGoal)} cal
              </ThemedText>
              <ThemedText style={[styles.summarySub, { color: colors.icon }]}>
                {isOverGoal
                  ? `${Math.round(overCalories)} cal over`
                  : `${Math.round(remainingCalories)} cal left`}
              </ThemedText>
            </View>
          </View>
        )}
        </View>
      </Card>

      <WeightCardDisplay></WeightCardDisplay>

      <Snackbar
        visible={showToast}
        onDismiss={() => setShowToast(false)}
        duration={2200}
        style={{ marginBottom: toastOffset }}
        contentStyle={{ alignItems: 'center' }}
      >
        <ThemedText style={{ color: colors.text, textAlign: 'center', width: '100%' }}>
          {toastEmoji} {toastText}
        </ThemedText>
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    gap: 8,
    padding: 8,
  },
  calorieCard: {
    alignSelf: 'center',
    width: '90%',
    marginHorizontal: 16,
  },
  calorieCardContent: {
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  zeroState: {
    gap: 12,
    alignItems: 'flex-start',
  },
  zeroStateText: {
    fontSize: 15,
    lineHeight: 21,
  },
  goalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartSection: {
    alignItems: 'center',
    gap: 8,
  },
  summaryContainer: {
    alignItems: 'center',
    gap: 2,
  },
  summaryMain: {
    fontSize: 20,
    fontWeight: '700',
  },
  summarySub: {
    fontSize: 14,
    fontWeight: '500',
  },
});
