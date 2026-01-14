import DuckTextInput from '@/components/interactions/inputs/textinput';
import ThemedText from '@/components/themedtext';
import { Food } from '@/types/food/food';
import { FoodMeasurement } from '@/types/foodmeasurement/foodmeasurement';
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
  nutritionRows,
  selectedEntry,
  onRemove,
  onConfirm,
  onDismiss,
}: IngredientModalProps) {
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
            <ScrollView style={styles.nutritionList}>
              {nutritionRows.length === 0 ? (
                <ThemedText
                  style={[styles.modalEmptyText, { color: colors.icon }]}
                >
                  No nutrition data available.
                </ThemedText>
              ) : (
                nutritionRows.map((row) => (
                  <View key={row.key} style={styles.nutritionRow}>
                    <ThemedText style={styles.nutritionLabel}>
                      {row.label}
                    </ThemedText>
                    <ThemedText style={styles.nutritionValue}>
                      {row.value}
                      {row.unit ? ` ${row.unit}` : ''}
                    </ThemedText>
                  </View>
                ))
              )}
            </ScrollView>

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
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
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
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
