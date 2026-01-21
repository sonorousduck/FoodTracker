import ThemedText from '@/components/themedtext';
import {
  buildMacroNutritionRowsFromTotals,
  buildNutritionRowsFromTotals,
  NutritionTotals,
} from '@/components/recipe/recipe-utils';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const formatNutritionValue = (
  value: number | null | undefined,
  unit: string,
) => {
  if (value == null) {
    return '-';
  }
  return unit ? `${value} ${unit}` : String(value);
};

type RecipeNutritionTotalsProps = {
  totals: NutritionTotals;
  perServingTotals: NutritionTotals | null;
  showAll: boolean;
  onToggleShowAll: () => void;
  colors: {
    modal: string;
    modalSecondary: string;
    text: string;
    icon: string;
  };
};

export default function RecipeNutritionTotals({
  totals,
  perServingTotals,
  showAll,
  onToggleShowAll,
  colors,
}: RecipeNutritionTotalsProps) {
  const macroTotals = useMemo(() => buildMacroNutritionRowsFromTotals(totals), [
    totals,
  ]);
  const allTotals = useMemo(
    () => buildNutritionRowsFromTotals(totals, true, false),
    [totals],
  );
  const extraTotals = useMemo(
    () =>
      allTotals.filter(
        (row) => !macroTotals.some((macro) => macro.key === row.key),
      ),
    [allTotals, macroTotals],
  );
  const perServingMacros = useMemo(() => {
    if (!perServingTotals) {
      return macroTotals.map((row) => ({ ...row, value: null }));
    }
    return buildMacroNutritionRowsFromTotals(perServingTotals);
  }, [macroTotals, perServingTotals]);
  const perServingAll = useMemo(() => {
    if (!perServingTotals) {
      return allTotals.map((row) => ({ ...row, value: null }));
    }
    return buildNutritionRowsFromTotals(perServingTotals, true, false);
  }, [allTotals, perServingTotals]);
  const perServingMacroMap = useMemo(
    () => new Map(perServingMacros.map((row) => [row.key, row])),
    [perServingMacros],
  );
  const perServingAllMap = useMemo(
    () => new Map(perServingAll.map((row) => [row.key, row])),
    [perServingAll],
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.modal, borderColor: colors.modalSecondary },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>Nutrition totals</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}
        >
          Entire recipe
        </ThemedText>
      </View>
      <View style={styles.columns}>
        <ThemedText style={styles.columnLabel}>Per serving</ThemedText>
        <ThemedText style={styles.columnLabel}>Total recipe</ThemedText>
      </View>
      <View>
        {macroTotals.map((row, index) => (
          <View
            key={row.key}
            style={[
              styles.row,
              index % 2 === 1
                ? { backgroundColor: colors.modalSecondary }
                : null,
            ]}
          >
            <ThemedText style={styles.label}>{row.label}</ThemedText>
            <View style={styles.values}>
              <ThemedText style={[styles.value, styles.perServingValue]}>
                {formatNutritionValue(
                  perServingMacroMap.get(row.key)?.value,
                  row.unit,
                )}
              </ThemedText>
              <ThemedText style={[styles.value, styles.totalValue]}>
                {formatNutritionValue(row.value, row.unit)}
              </ThemedText>
            </View>
          </View>
        ))}
        {showAll
          ? extraTotals.map((row, offset) => (
              <View
                key={row.key}
                style={[
                  styles.row,
                  (macroTotals.length + offset) % 2 === 1
                    ? { backgroundColor: colors.modalSecondary }
                    : null,
                ]}
              >
                <ThemedText style={styles.label}>{row.label}</ThemedText>
                <View style={styles.values}>
                  <ThemedText style={[styles.value, styles.perServingValue]}>
                    {formatNutritionValue(
                      perServingAllMap.get(row.key)?.value,
                      row.unit,
                    )}
                  </ThemedText>
                  <ThemedText style={[styles.value, styles.totalValue]}>
                    {formatNutritionValue(row.value, row.unit)}
                  </ThemedText>
                </View>
              </View>
            ))
          : null}
      </View>
      {extraTotals.length > 0 ? (
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              borderColor: colors.modalSecondary,
              backgroundColor: colors.modalSecondary,
            },
          ]}
          onPress={onToggleShowAll}
          testID="recipe-nutrition-toggle"
        >
          <ThemedText style={styles.toggleText}>
            {showAll ? 'All nutrients' : 'Macros only'}
          </ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: 8,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
  },
  values: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  perServingValue: {
    width: 84,
    textAlign: 'right',
    marginRight: 16,
  },
  totalValue: {
    width: 96,
    textAlign: 'right',
  },
  toggle: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
