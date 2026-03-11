import WebDatePicker from '@/components/interactions/inputs/webdatepicker';
import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { MealType } from '@/types/foodentry/updatefoodentry';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { mealOrder } from './foodentry-utils';

type CopyToDayModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (targetDate: Date, targetMealType: MealType) => void;
  selectedCount: number;
  defaultDate: Date;
  defaultMealType: MealType;
  isSubmitting?: boolean;
  colors: typeof Colors.light;
};

export default function CopyToDayModal({
  visible,
  onDismiss,
  onConfirm,
  selectedCount,
  defaultDate,
  defaultMealType,
  isSubmitting = false,
  colors,
}: CopyToDayModalProps) {
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [targetMealType, setTargetMealType] = useState<MealType>(defaultMealType);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Reset state when modal visibility changes
  useEffect(() => {
    if (visible) {
      setTargetDate(defaultDate);
      setTargetMealType(defaultMealType);
    }
  }, [visible, defaultDate, defaultMealType]);

  // Calculate the 7-day window centered on targetDate
  const dateWindow = useMemo(() => {
    const dates: Date[] = [];
    const centerDate = new Date(targetDate);
    const startDate = new Date(centerDate);
    startDate.setDate(startDate.getDate() - 3); // Show 3 days before

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [targetDate]);

  const handleDateChipPress = (date: Date) => {
    setTargetDate(date);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(targetDate);
    newDate.setDate(newDate.getDate() - 7);
    setTargetDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(targetDate);
    newDate.setDate(newDate.getDate() + 7);
    setTargetDate(newDate);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const formatDayLabel = (date: Date) => {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.modal },
            styles.shadow,
          ]}
        >
          {/* Drag Indicator */}
          <View
            style={[
              styles.dragIndicator,
              { backgroundColor: colors.modalSecondary },
            ]}
          />

          {/* Title */}
          <ThemedText style={styles.title}>Copy to...</ThemedText>

          {/* Date Slider */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Date</ThemedText>
            <View style={styles.dateSliderContainer}>
              <TouchableOpacity
                onPress={handlePreviousWeek}
                activeOpacity={0.7}
                style={styles.arrowButton}
              >
                <ThemedText style={styles.arrowText}>◀</ThemedText>
              </TouchableOpacity>

              <View style={styles.daysRow}>
                {dateWindow.map((date) => {
                  const isSelected = isSameDay(date, targetDate);
                  return (
                    <TouchableOpacity
                      key={date.toISOString()}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isSelected
                            ? colors.tint
                            : colors.modalSecondary,
                        },
                      ]}
                      onPress={() => handleDateChipPress(date)}
                      activeOpacity={0.8}
                    >
                      <ThemedText
                        style={[
                          styles.dayChipLabel,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {formatDayLabel(date)}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.dayChipDate,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {date.getDate()}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={handleNextWeek}
                activeOpacity={0.7}
                style={styles.arrowButton}
              >
                <ThemedText style={styles.arrowText}>▶</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker Button */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                { borderColor: colors.modalSecondary },
              ]}
              onPress={() => setIsDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[styles.datePickerButtonText, { color: colors.tint }]}
              >
                📅 Pick a different date
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Web Date Picker */}
          {Platform.OS === 'web' && (
            <View>
              <WebDatePicker
                label="📅 Pick a different date"
                value={targetDate}
                onChange={setTargetDate}
              />
            </View>
          )}

          {/* Meal Chips */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Meal</ThemedText>
            <View style={styles.chipRow}>
              {mealOrder.map((meal, index) => {
                const isActive = index === targetMealType;
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
                    onPress={() => setTargetMealType(index as MealType)}
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
          </View>

          {/* Copy Button */}
          <TouchableOpacity
            style={[
              styles.copyButton,
              {
                backgroundColor: colors.tint,
                opacity: selectedCount === 0 ? 0.5 : 1,
              },
            ]}
            onPress={() => onConfirm(targetDate, targetMealType)}
            activeOpacity={0.8}
            disabled={isSubmitting || selectedCount === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.copyButtonText}>
                Copy {selectedCount} item{selectedCount !== 1 ? 's' : ''}
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { borderColor: colors.modalSecondary },
            ]}
            onPress={onDismiss}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <ThemedText
              style={[styles.cancelButtonText, { color: colors.text }]}
            >
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal (Mobile only) */}
      {Platform.OS !== 'web' && (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={targetDate}
          onConfirm={(date) => {
            setTargetDate(date);
            setIsDatePickerVisible(false);
          }}
          onCancel={() => setIsDatePickerVisible(false)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  arrowButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  dayChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayChipDate: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  datePickerButtonText: {
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
  copyButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
