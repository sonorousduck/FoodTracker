import LogFood from "@/app/(app)/logfood";
import { createFoodEntry, getFoodEntryHistory } from "@/lib/api/foodentry";
import { getRecipes } from "@/lib/api/recipe";
import { searchFoods } from "@/lib/api/food";
import { getFoodByBarcode } from "@/lib/api/foodbarcode";
import { Food } from "@/types/food/food";
import { FoodEntry } from "@/types/foodentry/foodentry";
import { FoodMeasurement } from "@/types/foodmeasurement/foodmeasurement";
import { Meal } from "@/types/meal/meal";
import { Recipe } from "@/types/recipe/recipe";
import { User } from "@/types/users/user";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

const mockLocalSearchParams = jest.fn();
let mockRouter: { replace: jest.Mock };

jest.mock("expo-router", () => {
  const React = require("react");
  const router = { replace: jest.fn() };
  return {
    __esModule: true,
    __router: router,
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => cb(), [cb]);
    },
    useRouter: () => router,
    useLocalSearchParams: () => mockLocalSearchParams(),
  };
});

jest.mock("@/lib/api", () => ({
  __esModule: true,
  isAxiosError: jest.fn(() => false),
}));

jest.mock("@/lib/api/foodentry", () => ({
  __esModule: true,
  createFoodEntry: jest.fn(),
  getFoodEntryHistory: jest.fn(),
}));

jest.mock("@/lib/api/food", () => ({
  __esModule: true,
  searchFoods: jest.fn(),
}));

jest.mock("@/lib/api/foodbarcode", () => ({
  __esModule: true,
  getFoodByBarcode: jest.fn(),
}));

jest.mock("@/lib/api/recipe", () => ({
  __esModule: true,
  getRecipes: jest.fn(),
}));

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-native-modal-datetime-picker", () => {
  return () => null;
});

const mockedCreateFoodEntry = createFoodEntry as jest.MockedFunction<
  typeof createFoodEntry
>;
const mockedGetFoodEntryHistory = getFoodEntryHistory as jest.MockedFunction<
  typeof getFoodEntryHistory
>;
const mockedGetRecipes = getRecipes as jest.MockedFunction<typeof getRecipes>;
const mockedSearchFoods = searchFoods as jest.MockedFunction<typeof searchFoods>;
const mockedGetFoodByBarcode = getFoodByBarcode as jest.MockedFunction<
  typeof getFoodByBarcode
>;
const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

const createFoodFixture = (): Food => {
  const food: Food = {
    id: 1,
    name: "Greek yogurt",
    brand: "Acme Farms",
    calories: 100,
    protein: 10,
    carbs: 12,
    fat: 4,
    fiber: 0,
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
  };

  return food;
};

const createMeasurementFixture = (food: Food): FoodMeasurement => ({
  id: 55,
  food,
  unit: "cup",
  name: "1 cup",
  abbreviation: "cup",
  weightInGrams: 200,
  isDefault: true,
  isActive: true,
  isFromSource: false,
});

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

const createRecipeFixture = (user: User, id: number, title: string): Recipe => ({
  id,
  user,
  title,
  servings: 2,
  calories: 450,
  ingredients: [],
});

describe("LogFood", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = (jest.requireMock("expo-router") as { __router: { replace: jest.Mock } })
      .__router;
    mockRouter.replace.mockClear();
    mockedUseColorScheme.mockReturnValue("light");
    mockedSearchFoods.mockResolvedValue([]);
    mockedGetRecipes.mockResolvedValue([]);
    mockLocalSearchParams.mockReturnValue({});
  });

  it("logs a history item again", async () => {
    const food = createFoodFixture();
    const measurement = createMeasurementFixture(food);
    food.measurements = [measurement];
    const user = createUserFixture();
    const meal: Meal = {
      id: "meal-1",
      name: "Lunch",
      user,
      foodEntries: [],
    };
    const entry: FoodEntry = {
      id: 101,
      user,
      food,
      measurement,
      servings: 2,
      meal,
      recipe: undefined,
      loggedAt: new Date("2025-01-02T12:00:00.000Z"),
    };

    mockedGetFoodEntryHistory.mockResolvedValue([entry]);
    mockedCreateFoodEntry.mockResolvedValue(entry);

    const screen = render(
      <PaperProvider>
        <LogFood />
      </PaperProvider>
    );

    await act(async () => {});

    const historyItem = screen.getByTestId("history-item-101");
    fireEvent.press(historyItem);

    const submitButton = screen.getByTestId("foodentry-submit");
    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(mockedCreateFoodEntry).toHaveBeenCalledWith({
      servings: 2,
      mealType: 1,
      foodId: food.id,
      recipeId: undefined,
      measurementId: measurement.id,
      loggedAt: expect.any(Date),
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/diary");
  });

  it("opens the food modal after scanning a barcode", async () => {
    const food = createFoodFixture();
    mockLocalSearchParams.mockReturnValue({ barcode: "012345" });
    mockedGetFoodByBarcode.mockResolvedValue(food);

    const { getAllByText } = render(
      <PaperProvider>
        <LogFood />
      </PaperProvider>
    );

    await waitFor(() => {
      expect(mockedGetFoodByBarcode).toHaveBeenCalledWith("012345");
      expect(getAllByText(food.name).length).toBeGreaterThan(0);
    });
  });

  it("routes to create food when a barcode is not found", async () => {
    mockLocalSearchParams.mockReturnValue({ barcode: "999999" });
    mockedGetFoodByBarcode.mockResolvedValue(null);

    render(
      <PaperProvider>
        <LogFood />
      </PaperProvider>
    );

    await waitFor(() => {
      expect(mockedGetFoodByBarcode).toHaveBeenCalledWith("999999");
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/createfood",
        params: { barcode: "999999" },
      });
    });
  });

  it("filters history based on the search query", async () => {
    const user = createUserFixture();
    const meal: Meal = {
      id: "meal-1",
      name: "Lunch",
      user,
      foodEntries: [],
    };
    const foodA = createFoodFixture();
    const foodB = { ...createFoodFixture(), id: 2, name: "Chicken salad" };
    const measurementA = createMeasurementFixture(foodA);
    const measurementB = createMeasurementFixture(foodB);
    foodA.measurements = [measurementA];
    foodB.measurements = [measurementB];

    const entryA: FoodEntry = {
      id: 101,
      user,
      food: foodA,
      measurement: measurementA,
      servings: 1,
      meal,
      recipe: undefined,
      loggedAt: new Date("2025-01-02T12:00:00.000Z"),
    };
    const entryB: FoodEntry = {
      id: 102,
      user,
      food: foodB,
      measurement: measurementB,
      servings: 1,
      meal,
      recipe: undefined,
      loggedAt: new Date("2025-01-03T12:00:00.000Z"),
    };

    mockedGetFoodEntryHistory.mockResolvedValue([entryA, entryB]);

    const screen = render(
      <PaperProvider>
        <LogFood />
      </PaperProvider>
    );

    await act(async () => {});

    await act(async () => {
      fireEvent.changeText(screen.getByTestId("logfood-search-input"), "yogurt");
    });

    expect(screen.getByTestId("history-item-101")).toBeTruthy();
    expect(screen.queryByTestId("history-item-102")).toBeNull();
  });

  it("dedupes history items with the same food and servings", async () => {
    const user = createUserFixture();
    const meal: Meal = {
      id: "meal-1",
      name: "Lunch",
      user,
      foodEntries: [],
    };
    const food = createFoodFixture();
    const measurement = createMeasurementFixture(food);
    food.measurements = [measurement];

    const newerEntry: FoodEntry = {
      id: 201,
      user,
      food,
      measurement,
      servings: 2,
      meal,
      recipe: undefined,
      loggedAt: new Date("2025-01-05T12:00:00.000Z"),
    };
    const olderEntry: FoodEntry = {
      id: 200,
      user,
      food,
      measurement,
      servings: 2,
      meal,
      recipe: undefined,
      loggedAt: new Date("2025-01-02T12:00:00.000Z"),
    };

    mockedGetFoodEntryHistory.mockResolvedValue([olderEntry, newerEntry]);

    const screen = render(
      <PaperProvider>
        <LogFood />
      </PaperProvider>
    );

    await act(async () => {});

    expect(screen.getByTestId("history-item-201")).toBeTruthy();
    expect(screen.queryByTestId("history-item-200")).toBeNull();
  });

  it("filters the recipes tab list based on the search query", async () => {
    const user = createUserFixture();
    const recipeA = createRecipeFixture(user, 201, "Chili");
    const recipeB = createRecipeFixture(user, 202, "Pasta");

    mockedGetRecipes.mockResolvedValue([recipeA, recipeB]);

    const screen = render(
      <PaperProvider>
        <LogFood />
      </PaperProvider>
    );

    await act(async () => {});

    await act(async () => {
      fireEvent.press(screen.getByTestId("logfood-tab-recipes"));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("logfood-search-input"), "c");
    });

    expect(screen.getByTestId("recipes-tab-item-201")).toBeTruthy();
    expect(screen.queryByTestId("recipes-tab-item-202")).toBeNull();
  });
});
