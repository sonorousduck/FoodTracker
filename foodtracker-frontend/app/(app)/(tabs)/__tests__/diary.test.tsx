import Diary from "@/app/(app)/(tabs)/diary";
import { getDiaryEntries } from "@/lib/api/foodentry";
import { getRecipe } from "@/lib/api/recipe";
import { Food } from "@/types/food/food";
import { FoodEntry } from "@/types/foodentry/foodentry";
import { FoodMeasurement } from "@/types/foodmeasurement/foodmeasurement";
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

describe("Diary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseColorScheme.mockReturnValue("light");
  });

  it("renders total calories and meal entries", async () => {
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

    const screen = render(
      <PaperProvider>
        <Diary />
      </PaperProvider>
    );
    await act(async () => {});

    expect(screen.getByText("Total calories")).toBeTruthy();
    expect(screen.getAllByText("200 cal")).toHaveLength(2);
    expect(screen.getByText("Oatmeal")).toBeTruthy();
    expect(screen.getByText("1 serving · 1 cup")).toBeTruthy();

    fireEvent.press(screen.getByTestId("day-macro-toggle"));
    expect(screen.getByText("Day total")).toBeTruthy();
    expect(screen.getByText("Protein")).toBeTruthy();
    expect(screen.getByText("10 g")).toBeTruthy();
    expect(screen.getByText("Carbs")).toBeTruthy();
    expect(screen.getByText("20 g")).toBeTruthy();
    expect(screen.getByText("Fat")).toBeTruthy();
    expect(screen.getByText("4 g")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("diary-meal-breakfast-macro-toggle")
    );
    expect(screen.getAllByText("Protein")).toHaveLength(2);
    expect(screen.getAllByText("10 g")).toHaveLength(2);

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
