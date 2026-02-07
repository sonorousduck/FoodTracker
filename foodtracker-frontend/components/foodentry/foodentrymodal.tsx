import DuckTextInput from '@/components/interactions/inputs/textinput';
import {
  formatCalories,
  formatMeasurementText,
  getCaloriesForMeasurement,
  getDefaultMeasurement,
  getFoodMeasurements,
  getMeasurementById,
  normalizeAmount,
} from '@/components/recipe/recipe-utils';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { Food } from '@/types/food/food';
import { MealType } from '@/types/foodentry/updatefoodentry';
import { Recipe } from '@/types/recipe/recipe';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Modal, Portal } from 'react-native-paper';
import {
  formatServings,
  getRecipeCaloriesPerServing,
  mealOrder,
} from './foodentry-utils';

type FoodEntryModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (payload: {
    servings: number;
    mealType: MealType;
    measurementId?: number;
    loggedAt?: Date;
  }) => void;
  onDelete?: () => void;
  showDelete?: boolean;
  showDatePicker?: boolean;
  initialDate?: Date;
  food?: Food | null;
  recipe?: Recipe | null;
  initialMealType?: MealType;
  initialServings?: number;
  initialMeasurementId?: number | null;
  submitLabel?: string;
  isSubmitting?: boolean;
  colors: typeof Colors.light;
};

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

export default function FoodEntryModal({
  visible,
  onDismiss,
  onSubmit,
  onDelete,
  showDelete = false,
  showDatePicker = false,
  initialDate,
  food,
  recipe,
  initialMealType = 0,
  initialServings = 1,
  initialMeasurementId = null,
  submitLabel = 'Log',
  isSubmitting = false,
  colors,
}: FoodEntryModalProps) {
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>(initialMealType);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<
    number | null
  >(initialMeasurementId);
  const [servingInput, setServingInput] = useState(String(initialServings));
  const [selectedDate, setSelectedDate] = useState(initialDate ?? new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setSelectedMealType(initialMealType);
      const fallbackMeasurementId =
        initialMeasurementId ??
        (food ? (getDefaultMeasurement(food)?.id ?? null) : null);
      setSelectedMeasurementId(fallbackMeasurementId);
      setServingInput(formatServings(initialServings));
      setSelectedDate(initialDate ?? new Date());
    }
    wasVisibleRef.current = visible;
  }, [
    visible,
    initialMealType,
    initialMeasurementId,
    initialServings,
    food,
    initialDate,
  ]);

  const measurements = food ? getFoodMeasurements(food) : [];
  const selectedMeasurement = food
    ? getMeasurementById(food, selectedMeasurementId)
    : undefined;

  const totalCalories = useMemo(() => {
    const parsedServings = Number(normalizeAmount(servingInput));
    const servings =
      Number.isFinite(parsedServings) && parsedServings > 0
        ? parsedServings
        : 1;

    if (food) {
      return formatCalories(
        getCaloriesForMeasurement(food, selectedMeasurement, servings),
      );
    }

    if (recipe) {
      const perServing = getRecipeCaloriesPerServing(recipe);
      if (perServing == null) {
        return '';
      }
      return formatCalories(perServing * servings);
    }

    return '';
  }, [food, recipe, selectedMeasurement, servingInput]);

  const handleSubmit = () => {
    const parsedServings = Number(normalizeAmount(servingInput));
    const servings =
      Number.isFinite(parsedServings) && parsedServings > 0
        ? parsedServings
        : 1;
    onSubmit({
      servings,
      mealType: selectedMealType,
      measurementId: food ? (selectedMeasurementId ?? undefined) : undefined,
      loggedAt: showDatePicker ? selectedDate : undefined,
    });
  };

  const webDateValue = formatDateInput(selectedDate);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.modal },
        ]}
        testID="foodentry-modal"
      >
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>
            {food?.name ?? recipe?.title ?? 'Log item'}
          </ThemedText>
          <ThemedText style={[styles.modalSubtitle, { color: colors.icon }]}>
            {totalCalories}
          </ThemedText>

          <ThemedText style={styles.modalSectionTitle}>Meal</ThemedText>
          <View style={styles.chipRow}>
            {mealOrder.map((meal, index) => {
              const isActive = index === selectedMealType;
              return (
                <TouchableOpacity
                  key={meal}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive
                        ? colors.tint
                        : colors.modalSecondary,
                    },
                  ]}
                  onPress={() => setSelectedMealType(index)}
                  activeOpacity={0.8}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {meal}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {food ? (
            <>
              <ThemedText style={styles.modalSectionTitle}>
                Serving size
              </ThemedText>
              {measurements.length === 0 ? (
                <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                  No serving sizes available.
                </ThemedText>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.measurementList}
                >
                  {measurements.map((measurement) => {
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
                        onPress={() => setSelectedMeasurementId(measurement.id)}
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
              )}
            </>
          ) : null}

          <DuckTextInput
            label="Number of servings"
            value={servingInput}
            onChangeText={setServingInput}
            placeholder="1"
            enterKeyHint="done"
            inputMode="decimal"
            containerStyle={styles.modalInputContainer}
          />
          {showDatePicker ? (
            <View>
              <ThemedText style={styles.modalSectionTitle}>Log date</ThemedText>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={webDateValue}
                  type="date"
                  onChangeText={(value) => {
                    const parsed = parseDateInput(value);
                    if (parsed) {
                      setSelectedDate(parsed);
                    }
                  }}
                  onChange={(event) => {
                    const nextValue =
                      (event as unknown as { target?: { value?: string } })
                        .target?.value ??
                      (event as unknown as { nativeEvent?: { text?: string } })
                        .nativeEvent?.text;
                    if (nextValue) {
                      const parsed = parseDateInput(nextValue);
                      if (parsed) {
                        setSelectedDate(parsed);
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
              ) : (
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      borderColor: colors.modalSecondary,
                      backgroundColor: colors.modal,
                    },
                  ]}
                  onPress={() => setIsDatePickerVisible(true)}
                  activeOpacity={0.8}
                  testID="foodentry-date"
                >
                  <ThemedText style={styles.dateText}>
                    {selectedDate.toLocaleDateString()}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <View style={styles.modalActions}>
            {showDelete && onDelete ? (
              <TouchableOpacity
                style={[
                  styles.modalSecondaryButton,
                  { borderColor: colors.modalSecondary },
                ]}
                onPress={onDelete}
                activeOpacity={0.8}
                testID="foodentry-delete"
              >
                <ThemedText
                  style={[styles.modalSecondaryText, { color: colors.text }]}
                >
                  Delete
                </ThemedText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
              testID="foodentry-submit"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.modalPrimaryText}>
                  {submitLabel}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showDatePicker && Platform.OS !== 'web' ? (
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
    maxWidth: 520,
  },
  modalContent: {
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  modalSectionTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
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
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  modalPrimaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  webDateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 13,
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
  emptyText: {
    fontSize: 12,
  },
});
