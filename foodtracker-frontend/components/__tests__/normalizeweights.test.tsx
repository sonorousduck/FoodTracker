import { normalizeWeightsByDay } from "@/lib/weights/normalizeweights";
import { Weight } from "@/types/weight/weight";

const makeWeight = (overrides: Partial<Weight>): Weight => ({
  id: overrides.id ?? 1,
  weightEntry: overrides.weightEntry ?? 170,
  date: overrides.date ?? new Date("2025-01-01T08:00:00.000Z"),
  user: overrides.user ?? ({} as never),
  createdDate: overrides.createdDate ?? new Date("2025-01-01T09:00:00.000Z"),
});

describe("normalizeWeightsByDay", () => {
  it("keeps the latest measurement for each day and sorts ascending", () => {
    const weights: ReadonlyArray<Weight> = [
      makeWeight({
        id: 1,
        weightEntry: 180.2,
        date: new Date("2025-01-02T08:00:00.000Z"),
      }),
      makeWeight({
        id: 2,
        weightEntry: 179.6,
        date: new Date("2025-01-01T07:00:00.000Z"),
      }),
      makeWeight({
        id: 3,
        weightEntry: 179.2,
        date: new Date("2025-01-01T21:30:00.000Z"),
      }),
    ];

    const result = normalizeWeightsByDay(weights);

    expect(result).toHaveLength(2);
    expect(result[0]?.weightEntry).toBe(179.2);
    expect(result[1]?.weightEntry).toBe(180.2);
  });
});
