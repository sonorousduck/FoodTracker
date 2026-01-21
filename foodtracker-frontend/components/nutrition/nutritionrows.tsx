import ThemedText from '@/components/themedtext';
import { NutritionRow } from '@/components/recipe/recipe-utils';
import { StyleSheet, View } from 'react-native';

type NutritionRowsProps = {
  rows: NutritionRow[];
  alternateBackground?: string;
};

export default function NutritionRows({
  rows,
  alternateBackground,
}: NutritionRowsProps) {
  return (
    <View>
      {rows.map((row, index) => (
        <View
          key={row.key}
          style={[
            styles.nutritionRow,
            index % 2 === 1 && alternateBackground
              ? { backgroundColor: alternateBackground }
              : null,
          ]}
        >
          <ThemedText style={styles.nutritionLabel}>{row.label}</ThemedText>
          <ThemedText style={styles.nutritionValue}>
            {row.value === null ? '-' : row.value}
            {row.value === null ? '' : row.unit ? ` ${row.unit}` : ''}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 12,
  },
  nutritionValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
