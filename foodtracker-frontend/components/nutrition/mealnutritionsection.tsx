import ThemedText from '@/components/themedtext';
import NutritionRows from '@/components/nutrition/nutritionrows';
import { NutritionRow } from '@/components/recipe/recipe-utils';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type MealNutritionSectionProps = {
  title?: string;
  rows: NutritionRow[];
  alternateBackground?: string;
  isExpanded: boolean;
  showAll: boolean;
  onToggleExpanded: () => void;
  onToggleShowAll: () => void;
  testIDPrefix: string;
  borderColor: string;
  textColor: string;
};

export default function MealNutritionSection({
  title,
  rows,
  alternateBackground,
  isExpanded,
  showAll,
  onToggleExpanded,
  onToggleShowAll,
  testIDPrefix,
  borderColor,
  textColor,
}: MealNutritionSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        {title ? <ThemedText style={styles.title}>{title}</ThemedText> : <View style={styles.titleSpacer} />}
        <View style={styles.toggleRow}>
          <View style={styles.primaryToggleSlot}>
            <TouchableOpacity
              style={[styles.toggleButton, { borderColor }]}
              onPress={onToggleExpanded}
              activeOpacity={0.7}
              testID={`${testIDPrefix}-macro-toggle`}
            >
              <ThemedText style={[styles.toggleText, { color: textColor }]}>
                {isExpanded ? 'Hide macros' : 'Show macros'}
              </ThemedText>
              <ThemedText style={[styles.toggleIcon, { color: textColor }]}>
                {isExpanded ? '▲' : '▼'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          {isExpanded ? (
            <TouchableOpacity
              style={[styles.toggleButton, { borderColor }]}
              onPress={onToggleShowAll}
              activeOpacity={0.7}
              testID={`${testIDPrefix}-nutrients-toggle`}
            >
              <ThemedText style={[styles.toggleText, { color: textColor }]}>
                {showAll ? 'All nutrients' : 'Macros only'}
              </ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {isExpanded ? (
        <NutritionRows rows={rows} alternateBackground={alternateBackground} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  titleSpacer: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryToggleSlot: {
    minWidth: 116,
    alignItems: 'flex-end',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toggleIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
});
