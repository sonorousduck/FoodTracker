import { Weight } from "@/types/weight/weight";

const dayKey = (value: Date) =>
  `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;

const toDate = (value: Date) => (value instanceof Date ? value : new Date(value));

export const normalizeWeightsByDay = (
  weights: ReadonlyArray<Weight>
): ReadonlyArray<Weight> => {
  const byDay = new Map<string, Weight>();

  for (const entry of weights) {
    const entryDate = toDate(entry.date);
    const key = dayKey(entryDate);
    const existing = byDay.get(key);

    if (!existing) {
      byDay.set(key, { ...entry, date: entryDate });
      continue;
    }

    const existingDate = toDate(existing.date);
    if (entryDate.getTime() > existingDate.getTime()) {
      byDay.set(key, { ...entry, date: entryDate });
    }
  }

  return Array.from(byDay.values()).sort((left, right) => {
    const leftDate = toDate(left.date).getTime();
    const rightDate = toDate(right.date).getTime();
    return leftDate - rightDate;
  });
};
