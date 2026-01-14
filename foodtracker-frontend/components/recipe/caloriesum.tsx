import ThemedText from '@/components/themedtext';
import { StyleSheet, View } from 'react-native';
import { formatCalories, RecipeColors } from './recipe-utils';

export const CALORIE_SUM_HEIGHT = 72;

type CalorieSumProps = {
  colors: RecipeColors;
  totalCalories: number;
  perServingCalories: number | null;
};

export default function CalorieSum({
  colors,
  totalCalories,
  perServingCalories,
}: CalorieSumProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.modal,
          borderTopColor: colors.modalSecondary,
        },
      ]}
      testID="recipe-calorie-sum"
    >
      <View>
        <ThemedText style={[styles.label, { color: colors.icon }]}>
          Total calories
        </ThemedText>
        <ThemedText
          style={[styles.value, { color: colors.text }]}
          testID="recipe-calorie-sum-value"
        >
          {formatCalories(totalCalories)}
        </ThemedText>
      </View>
      <View style={styles.perServing}>
        <ThemedText style={[styles.label, { color: colors.icon }]}>
          Per serving
        </ThemedText>
        <ThemedText
          style={[styles.value, { color: colors.text }]}
          testID="recipe-calorie-sum-per-serving"
        >
          {perServingCalories === null
            ? '-'
            : formatCalories(perServingCalories)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CALORIE_SUM_HEIGHT,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perServing: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
});
