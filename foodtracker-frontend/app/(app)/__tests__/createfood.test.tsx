import CreateFood from "@/app/(app)/createfood";
import { createFood } from "@/lib/api/food";
import { createBarcodeMapping } from "@/lib/api/foodbarcode";
import { createFoodEntry } from "@/lib/api/foodentry";
import { Food } from "@/types/food/food";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert, useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

const mockReplace = jest.fn();
const mockLocalSearchParams = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => cb(), [cb]);
    },
    useRouter: () => ({ replace: mockReplace }),
    useLocalSearchParams: () => mockLocalSearchParams(),
  };
});

jest.mock("@/lib/api/food", () => ({
  __esModule: true,
  createFood: jest.fn(),
}));

jest.mock("@/lib/api/foodbarcode", () => ({
  __esModule: true,
  createBarcodeMapping: jest.fn(),
}));

jest.mock("@/lib/api/foodentry", () => ({
  __esModule: true,
  createFoodEntry: jest.fn(),
}));

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-native-modal-datetime-picker", () => {
  return () => null;
});

const mockedCreateFood = createFood as jest.MockedFunction<typeof createFood>;
const mockedCreateBarcodeMapping =
  createBarcodeMapping as jest.MockedFunction<typeof createBarcodeMapping>;
const mockedCreateFoodEntry =
  createFoodEntry as jest.MockedFunction<typeof createFoodEntry>;
const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

const createFoodFixture = (): Food => ({
  id: 12,
  name: "Homemade oats",
  brand: undefined,
  calories: 140,
  protein: 6,
  carbs: 24,
  fat: 2,
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
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  createdBy: undefined,
  sourceId: undefined,
  recipeFoods: [],
  measurements: [],
});

describe("CreateFood", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseColorScheme.mockReturnValue("light");
    mockLocalSearchParams.mockReturnValue({});
    mockedCreateFood.mockResolvedValue(createFoodFixture());
  });

  it("saves a food and returns to log food", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        const saveOnly = buttons?.find((button) => button.text === "Save only");
        saveOnly?.onPress?.();
      });

    const { getByTestId, getByText } = render(
      <PaperProvider>
        <CreateFood />
      </PaperProvider>
    );

    act(() => {
      fireEvent.changeText(
        getByTestId("createfood-name-input"),
        "Homemade oats"
      );
      fireEvent.changeText(getByTestId("createfood-calories-input"), "140");
    });

    act(() => {
      fireEvent.press(getByTestId("createfood-save-button"));
    });

    await waitFor(() => {
      expect(mockedCreateFood).toHaveBeenCalled();
      expect(mockedCreateBarcodeMapping).not.toHaveBeenCalled();
      expect(mockedCreateFoodEntry).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/logfood");
    });

    alertSpy.mockRestore();
  });
});
