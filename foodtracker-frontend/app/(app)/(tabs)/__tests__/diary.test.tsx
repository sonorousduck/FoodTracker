import Diary from "@/app/(app)/(tabs)/diary";
import { getDiaryEntries } from "@/lib/api/foodentry";
import { getCurrentGoals } from "@/lib/api/goal";
import { getRecipe } from "@/lib/api/recipe";
import { Food } from "@/types/food/food";
import { FoodEntry } from "@/types/foodentry/foodentry";
import { FoodMeasurement } from "@/types/foodmeasurement/foodmeasurement";
import { Goal } from "@/types/goal/goal";
import { GoalType } from "@/types/goal/goaltype";
import { Meal } from "@/types/meal/meal";
import { Recipe } from "@/types/recipe/recipe";
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

jest.mock("@/lib/api/foodentry", () => ({
  __esModule: true,
  getDiaryEntries: jest.fn(),
}));

jest.mock("@/lib/api/goal", () => ({
  __esModule: true,
  getCurrentGoals: jest.fn(),
}));

jest.mock("@/lib/api/recipe", () => ({
  __esModule: true,
  getRecipe: jest.fn(),
}));

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-native-modal-datetime-picker", () => {
  return () => null;
});

jest.mock("@react-native-community/datetimepicker", () => {
  return () => null;
});

const mockedGetDiaryEntries = getDiaryEntries as jest.MockedFunction<
  typeof getDiaryEntries
>;
const mockedGetRecipe = getRecipe as jest.MockedFunction<typeof getRecipe>;
const mockedGetCurrentGoals = getCurrentGoals as jest.MockedFunction<
  typeof getCurrentGoals
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

const createFoodFixture = (): Food => ({
  id: 7,
  name: "Oatmeal",
  brand: "Acme",
  calories: 100,
  protein: 5,
  carbs: 10,
  fat: 2,
  fiber: 3,
  sugar: 0,
  sodium: 0,
  saturatedFat: 0,
  transFat: 0,
  cholesterol: 0,
  addedSugar: 0,
  netCarbs: 0,
  solubleFiber: 0,
  insolubleFiber: 0,
  water: 0,
  pralScore: 0,
  omega3: 0,
  omega6: 0,
  calcium: 0,
  iron: 0,
  potassium: 0,
  magnesium: 0,
  vitaminAiu: 0,
  vitaminArae: 0,
  vitaminC: 0,
  vitaminB12: 0,
  vitaminD: 0,
  vitaminE: 0,
  phosphorus: 0,
  zinc: 0,
  copper: 0,
  manganese: 0,
  selenium: 0,
  fluoride: 0,
  molybdenum: 0,
  chlorine: 0,
  vitaminB1: 0,
  vitaminB2: 0,
  vitaminB3: 0,
  vitaminB5: 0,
  vitaminB6: 0,
  biotin: 0,
  folate: 0,
  folicAcid: 0,
  foodFolate: 0,
  folateDfe: 0,
  choline: 0,
  betaine: 0,
  retinol: 0,
  caroteneBeta: 0,
  caroteneAlpha: 0,
  lycopene: 0,
  luteinZeaxanthin: 0,
  vitaminD2: 0,
  vitaminD3: 0,
  vitaminDiu: 0,
  vitaminK: 0,
  dihydrophylloquinone: 0,
  menaquinone4: 0,
  monoFat: 0,
  polyFat: 0,
  ala: 0,
  epa: 0,
  dpa: 0,
  dha: 0,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  createdBy: undefined,
  sourceId: undefined,
  recipeFoods: [],
  measurements: [],
});

const createMeasurementFixture = (food: Food): FoodMeasurement => ({
  id: 23,
  food,
  unit: "cup",
  name: "1 cup",
  abbreviation: "cup",
  weightInGrams: 200,
  isDefault: true,
  isActive: true,
  isFromSource: false,
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

describe("Diary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseColorScheme.mockReturnValue("light");
  });

  it("renders calorie goals and meal entries", async () => {
    const user = createUserFixture();
    const food = createFoodFixture();
    const measurement = createMeasurementFixture(food);
    food.measurements = [measurement];

    const meal: Meal = {
      id: "meal-1",
      name: "Breakfast",
      user,
      foodEntries: [],
    };

    const entry: FoodEntry = {
      id: 1,
      user,
      food,
      measurement,
      servings: 1,
      meal,
      recipe: undefined,
      loggedAt: new Date("2025-01-02T08:00:00.000Z"),
    };

    mockedGetDiaryEntries.mockResolvedValue([entry]);
    mockedGetCurrentGoals.mockResolvedValue({
      [GoalType.Calorie]: createGoalFixture(user, GoalType.Calorie, 1800),
      [GoalType.Protein]: createGoalFixture(user, GoalType.Protein, 120),
      [GoalType.Carbohydrates]: createGoalFixture(
        user,
        GoalType.Carbohydrates,
        200
      ),
      [GoalType.Fat]: createGoalFixture(user, GoalType.Fat, 60),
    });

    const screen = render(
      <PaperProvider>
        <Diary />
      </PaperProvider>
    );
    await act(async () => {});

    expect(screen.getByText("Calories")).toBeTruthy();
    expect(screen.getByText("Goal")).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getByText("Remaining")).toBeTruthy();
    expect(screen.getAllByText("200 cal")).toHaveLength(3);
    expect(screen.getByText("Oatmeal")).toBeTruthy();
    expect(screen.getByText("1 serving · 1 cup")).toBeTruthy();

    fireEvent.press(screen.getByTestId("macro-goals-toggle"));
    expect(screen.getByText("Protein")).toBeTruthy();
    expect(screen.getByText("Carbs")).toBeTruthy();
    expect(screen.getByText("Fat")).toBeTruthy();

    fireEvent.press(screen.getByTestId("day-macro-toggle"));
    expect(screen.getByText("Day total")).toBeTruthy();
    expect(screen.getAllByText("Protein").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("10 g").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Carbs").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("20 g").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Fat").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("4 g").length).toBeGreaterThanOrEqual(1);

    fireEvent.press(
      screen.getByTestId("diary-meal-breakfast-macro-toggle")
    );
    expect(screen.getAllByText("Protein").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("10 g").length).toBeGreaterThanOrEqual(2);

    fireEvent.press(screen.getByTestId("day-nutrients-toggle"));
    expect(screen.getByText("Fiber")).toBeTruthy();
    expect(screen.getByText("6 g")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("diary-meal-breakfast-nutrients-toggle")
    );
    expect(screen.getAllByText("Fiber")).toHaveLength(2);
    expect(screen.getAllByText("6 g")).toHaveLength(2);
  });

  it("hydrates recipe entries for nutrition totals", async () => {
    const user = createUserFixture();
    const food = createFoodFixture();
    const measurement = createMeasurementFixture(food);
    food.measurements = [measurement];

    const meal: Meal = {
      id: "meal-2",
      name: "Breakfast",
      user,
      foodEntries: [],
    };

    const recipe = {
      id: 42,
      user,
      title: "Test bowl",
      servings: 1,
    } as Recipe;

    const entry: FoodEntry = {
      id: 2,
      user,
      recipe,
      servings: 1,
      meal,
      food: undefined,
      measurement: undefined,
      loggedAt: new Date("2025-01-02T09:00:00.000Z"),
    };

    const hydratedRecipe: Recipe = {
      ...recipe,
      ingredients: [
        {
          id: "ing-1",
          recipe: recipe,
          food,
          servings: 1,
          measurementId: measurement.id,
        },
      ],
    };

    mockedGetDiaryEntries.mockResolvedValue([entry]);
    mockedGetCurrentGoals.mockResolvedValue({});
    mockedGetRecipe.mockResolvedValueOnce(hydratedRecipe);

    const screen = render(
      <PaperProvider>
        <Diary />
      </PaperProvider>
    );
    await act(async () => {});

    fireEvent.press(
      screen.getByTestId("diary-meal-breakfast-macro-toggle")
    );
    expect(screen.getByText("Protein")).toBeTruthy();
    expect(screen.getByText("10 g")).toBeTruthy();
  });
});
