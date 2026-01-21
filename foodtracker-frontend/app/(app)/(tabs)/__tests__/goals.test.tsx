import Goals from "@/app/(app)/(tabs)/goals";
import { getCurrentGoals, setNutritionGoals } from "@/lib/api/goal";
import { Goal } from "@/types/goal/goal";
import { GoalType } from "@/types/goal/goaltype";
import { User } from "@/types/users/user";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => cb(), [cb]);
    },
  };
});

jest.mock("@/lib/api/goal", () => ({
  __esModule: true,
  getCurrentGoals: jest.fn(),
  setNutritionGoals: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  __esModule: true,
  isAxiosError: () => false,
}));

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedGetCurrentGoals = getCurrentGoals as jest.MockedFunction<
  typeof getCurrentGoals
>;
const mockedSetNutritionGoals = setNutritionGoals as jest.MockedFunction<
  typeof setNutritionGoals
>;
const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

const createUserFixture = (): User => ({
  id: 1,
  email: "test@example.com",
  password: "password",
  firstName: "Testy",
  lastName: "McTest",
  refreshTokenHash: null,
  refreshTokenExpiresAt: null,
  foods: [],
  foodEntries: [],
  meals: [],
  recipes: [],
  weightEntries: [],
  goals: [],
});

const createGoalFixture = (
  user: User,
  goalType: GoalType,
  value: number
): Goal => ({
  id: Math.round(value),
  name: "Goal",
  value,
  goalType,
  user,
  startDate: new Date("2025-01-01T00:00:00.000Z"),
  endDate: new Date("2025-01-02T00:00:00.000Z"),
  createdDate: new Date("2025-01-02T00:00:00.000Z"),
});

describe("Goals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseColorScheme.mockReturnValue("light");
  });

  it("shows percent-based goals and computed grams", async () => {
    const user = createUserFixture();
    mockedGetCurrentGoals.mockResolvedValue({
      [GoalType.ProteinPercent]: createGoalFixture(
        user,
        GoalType.ProteinPercent,
        30
      ),
      [GoalType.CarbohydratesPercent]: createGoalFixture(
        user,
        GoalType.CarbohydratesPercent,
        40
      ),
      [GoalType.FatPercent]: createGoalFixture(user, GoalType.FatPercent, 30),
    });

    const screen = render(
      <PaperProvider>
        <Goals />
      </PaperProvider>
    );
    await act(async () => {});

    expect(screen.getByText("Goals")).toBeTruthy();
    expect(screen.getByText("Percent")).toBeTruthy();
    expect(screen.getByText("Est. 150 g")).toBeTruthy();
    expect(screen.getByText("Est. 200 g")).toBeTruthy();
    expect(screen.getByText("Est. 67 g")).toBeTruthy();
    expect(screen.getByText("Total: 100%")).toBeTruthy();
  });

  it("prevents save when percent totals are invalid", async () => {
    mockedGetCurrentGoals.mockResolvedValue({});

    const screen = render(
      <PaperProvider>
        <Goals />
      </PaperProvider>
    );
    await act(async () => {});

    fireEvent.press(screen.getByText("Percent"));
    const percentInputs = screen.getAllByPlaceholderText("30");
    fireEvent.changeText(percentInputs[0], "40");
    fireEvent.changeText(screen.getByPlaceholderText("40"), "30");
    fireEvent.changeText(percentInputs[1], "10");

    fireEvent.press(screen.getByTestId("goals-save"));
    expect(mockedSetNutritionGoals).not.toHaveBeenCalled();
    expect(screen.getByText("Percentages must add up to 100")).toBeTruthy();
  });
});
