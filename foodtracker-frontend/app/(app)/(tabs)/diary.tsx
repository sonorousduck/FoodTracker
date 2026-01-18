import {
  formatEntryCalories,
  getEntryCalories,
  getEntryServingsText,
  getEntryTitle,
  getMealTypeFromName,
  mealOrder,
} from "@/components/foodentry/foodentry-utils";
import FoodEntryModal from "@/components/foodentry/foodentrymodal";
import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import { deleteFoodEntry, getDiaryEntries, updateFoodEntry } from "@/lib/api/foodentry";
import { FoodEntry } from "@/types/foodentry/foodentry";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const WebDateInput = TextInput as unknown as React.ComponentType<
  ComponentProps<typeof TextInput> & { type?: string }
>;

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

export default function Tab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEntries = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const response = await getDiaryEntries(startOfDay.toISOString());
      setEntries(response);
    } catch (error) {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries(selectedDate);
    }, [loadEntries, selectedDate])
  );

  const totalCalories = useMemo(
    () =>
      entries.reduce((total, entry) => {
        const calories = getEntryCalories(entry);
        return total + (calories ?? 0);
      }, 0),
    [entries]
  );

  const groupedEntries = useMemo(
    () =>
      mealOrder.map((mealName) => ({
        mealName,
        entries: entries.filter((entry) => entry.meal?.name === mealName),
      })),
    [entries]
  );

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  const webDateValue = useMemo(
    () => formatDateInput(selectedDate),
    [selectedDate]
  );

  const goToPreviousDay = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1)
    );
  };

  const goToNextDay = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1)
    );
  };

  const openEditModal = (entry: FoodEntry) => {
    setSelectedEntry(entry);
    setIsModalVisible(true);
  };

  const handleUpdateEntry = async ({
    servings,
    mealType,
    measurementId,
  }: {
    servings: number;
    mealType: number;
    measurementId?: number;
    loggedAt?: Date;
  }) => {
    if (!selectedEntry) {
      return;
    }
    setIsSubmitting(true);
    try {
      await updateFoodEntry(selectedEntry.id, {
        servings,
        mealType,
        measurementId,
      });
      setIsModalVisible(false);
      setSelectedEntry(null);
      await loadEntries(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteFoodEntry(selectedEntry.id);
      setIsModalVisible(false);
      setSelectedEntry(null);
      await loadEntries(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Diary</ThemedText>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.modalSecondary }]}
              onPress={goToPreviousDay}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateButtonText}>◀</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateDisplay,
                { borderColor: colors.modalSecondary, backgroundColor: colors.modal },
              ]}
              onPress={() => setIsDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.modalSecondary }]}
              onPress={goToNextDay}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.dateButtonText}>▶</ThemedText>
            </TouchableOpacity>
          </View>
          {Platform.OS === "web" && isDatePickerVisible ? (
            <View style={styles.webDatePicker}>
              <WebDateInput
                value={webDateValue}
                type="date"
                onChangeText={(value) => {
                  const parsed = parseDateInput(value);
                  if (parsed) {
                    setSelectedDate(parsed);
                    setIsDatePickerVisible(false);
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
                      setIsDatePickerVisible(false);
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
            </View>
          ) : null}
          <View
            style={[
              styles.totalCard,
              {
                backgroundColor: colors.modal,
                borderColor: colors.modalSecondary,
              },
            ]}
          >
            <ThemedText style={[styles.totalLabel, { color: colors.icon }]}>
              Total calories
            </ThemedText>
            <ThemedText style={styles.totalValue}>
              {Math.round(totalCalories)} cal
            </ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : (
          groupedEntries.map((section) => (
            <View key={section.mealName} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  {section.mealName}
                </ThemedText>
                <ThemedText
                  style={[styles.sectionCount, { color: colors.icon }]}
                >
                  {section.entries.length}
                </ThemedText>
              </View>
              {section.entries.length === 0 ? (
                <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                  Nothing logged yet.
                </ThemedText>
              ) : (
                section.entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      {
                        borderColor: colors.modalSecondary,
                        backgroundColor: colors.modal,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => openEditModal(entry)}
                    testID={`diary-item-${entry.id}`}
                  >
                    <View style={styles.entryRow}>
                      <View style={styles.entryInfo}>
                        <ThemedText style={styles.entryTitle}>
                          {getEntryTitle(entry)}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.entrySubtitle,
                            { color: colors.icon },
                          ]}
                        >
                          {getEntryServingsText(entry)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.entryCalories}>
                        {formatEntryCalories(entry)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ))
        )}
      </ScrollView>
      <FoodEntryModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        onSubmit={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        showDelete
        food={selectedEntry?.food}
        recipe={selectedEntry?.recipe}
        initialMealType={getMealTypeFromName(selectedEntry?.meal?.name)}
        initialMeasurementId={selectedEntry?.measurement?.id ?? null}
        initialServings={selectedEntry?.servings ?? 1}
        submitLabel="Update"
        isSubmitting={isSubmitting}
        colors={colors}
      />
      {Platform.OS !== "web" ? (
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
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateDisplay: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  webDatePicker: {
    alignSelf: "flex-start",
  },
  webDateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  totalCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  loading: {
    paddingVertical: 24,
    alignItems: "center",
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 12,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryInfo: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  entrySubtitle: {
    fontSize: 12,
  },
  entryCalories: {
    fontSize: 13,
    fontWeight: "700",
  },
});
