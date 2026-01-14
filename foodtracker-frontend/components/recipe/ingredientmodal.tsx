import DuckTextInput from '@/components/interactions/inputs/textinput';
import ThemedText from '@/components/themedtext';
import { Food } from '@/types/food/food';
import { FoodMeasurement } from '@/types/foodmeasurement/foodmeasurement';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import {
  formatMeasurementText,
  IngredientEntry,
  NutritionRow,
  RecipeColors,
} from './recipe-utils';

type IngredientModalProps = {
  colors: RecipeColors;
  visible: boolean;
  selectedFood: Food | null;
  selectedMeasurements: FoodMeasurement[];
  selectedMeasurementId: number | null;
  onSelectMeasurementId: (measurementId: number) => void;
  servingInput: string;
  onServingInputChange: (value: string) => void;
  coreNutritionRows: NutritionRow[];
  nutritionRows: NutritionRow[];
  selectedEntry?: IngredientEntry;
  onRemove: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
};

export default function IngredientModal({
  colors,
  visible,
  selectedFood,
  selectedMeasurements,
  selectedMeasurementId,
  onSelectMeasurementId,
  servingInput,
  onServingInputChange,
  coreNutritionRows,
  nutritionRows,
  selectedEntry,
  onRemove,
  onConfirm,
  onDismiss,
}: IngredientModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const extraNutritionRows = nutritionRows.filter(
    (row) => !coreNutritionRows.some((coreRow) => coreRow.key === row.key),
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.modal },
        ]}
        testID="ingredient-details-modal"
      >
        {selectedFood && (
          <View style={styles.modalContent} testID="ingredient-details-content">
            <ThemedText style={styles.modalTitle}>
              {selectedFood.name}
            </ThemedText>
            {selectedFood.brand ? (
              <ThemedText
                style={[styles.modalSubtitle, { color: colors.icon }]}
              >
                {selectedFood.brand}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.modalSectionTitle}>
              Serving size
            </ThemedText>
            {selectedMeasurements.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.measurementList}
              >
                {selectedMeasurements.map((measurement) => {
                  const isSelected = measurement.id === selectedMeasurementId;
                  return (
                    <TouchableOpacity
                      key={measurement.id}
                      style={[
                        styles.measurementChip,
                        {
                          backgroundColor: isSelected
                            ? colors.tint
                            : colors.modalSecondary,
                        },
                      ]}
                      onPress={() => onSelectMeasurementId(measurement.id)}
                      activeOpacity={0.8}
                    >
                      <ThemedText
                        style={[
                          styles.measurementChipText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {formatMeasurementText(measurement)}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <ThemedText
                style={[styles.modalEmptyText, { color: colors.icon }]}
              >
                No serving sizes available.
              </ThemedText>
            )}

            <DuckTextInput
              label="Number of servings"
              value={servingInput}
              onChangeText={onServingInputChange}
              placeholder="1"
              enterKeyHint="done"
              inputMode="decimal"
              containerStyle={styles.modalInputContainer}
            />

            <ThemedText style={styles.modalSectionTitle}>
              Nutrition facts
            </ThemedText>
            {coreNutritionRows.length === 0 ? (
              <ThemedText
                style={[styles.modalEmptyText, { color: colors.icon }]}
              >
                No nutrition data available.
              </ThemedText>
            ) : (
              <View>
                <ScrollView style={styles.nutritionList}>
                  {coreNutritionRows.map((row, index) => (
                    <View
                      key={row.key}
                      style={[
                        styles.nutritionRow,
                        index % 2 === 1
                          ? { backgroundColor: colors.modalSecondary }
                          : null,
                      ]}
                    >
                      <ThemedText style={styles.nutritionLabel}>
                        {row.label}
                      </ThemedText>
                      <ThemedText style={styles.nutritionValue}>
                        {row.value === null ? '-' : row.value}
                        {row.value === null
                          ? ''
                          : row.unit
                            ? ` ${row.unit}`
                            : ''}
                      </ThemedText>
                    </View>
                  ))}
                  {isExpanded
                    ? extraNutritionRows.map((row, offset) => (
                        <View
                          key={row.key}
                          style={[
                            styles.nutritionRow,
                            (coreNutritionRows.length + offset) % 2 === 1
                              ? { backgroundColor: colors.modalSecondary }
                              : null,
                          ]}
                        >
                          <ThemedText style={styles.nutritionLabel}>
                            {row.label}
                          </ThemedText>
                          <ThemedText style={styles.nutritionValue}>
                            {row.value === null ? '-' : row.value}
                            {row.value === null
                              ? ''
                              : row.unit
                                ? ` ${row.unit}`
                                : ''}
                          </ThemedText>
                        </View>
                      ))
                    : null}
                </ScrollView>
                {extraNutritionRows.length > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.expandButton,
                      {
                        borderColor: colors.modalSecondary,
                        backgroundColor: colors.modalSecondary,
                      },
                    ]}
                    onPress={() => setIsExpanded((prev) => !prev)}
                    testID="nutrition-expand-toggle"
                  >
                    <ThemedText
                      style={[styles.expandButtonText, { color: colors.text }]}
                    >
                      {isExpanded ? 'Hide details' : 'Show all nutrition'}
                    </ThemedText>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <View style={styles.modalActions}>
              {selectedEntry ? (
                <TouchableOpacity
                  style={[
                    styles.modalSecondaryButton,
                    { borderColor: colors.modalSecondary },
                  ]}
                  onPress={onRemove}
                >
                  <ThemedText
                    style={[styles.modalSecondaryText, { color: colors.text }]}
                  >
                    Remove
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={onConfirm}
                testID="ingredient-add-button"
              >
                <ThemedText style={styles.modalPrimaryText}>
                  {selectedEntry ? 'Update' : 'Add'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 512,
  },
  modalContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  modalSectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  measurementList: {
    paddingBottom: 4,
  },
  measurementChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  measurementChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalInputContainer: {
    marginTop: 8,
  },
  nutritionList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  expandButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
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
  modalEmptyText: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalPrimaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSecondaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  modalSecondaryText: {
    fontWeight: '600',
  },
});
