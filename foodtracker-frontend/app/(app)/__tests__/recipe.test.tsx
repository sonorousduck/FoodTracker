import Recipe from '@/app/(app)/recipe';
import { isAxiosError } from '@/lib/api';
import { searchFoods } from '@/lib/api/food';
import { createRecipe } from '@/lib/api/recipe';
import { Food } from '@/types/food/food';
import { FoodMeasurement } from '@/types/foodmeasurement/foodmeasurement';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

let headerRightRenderer: (() => React.ReactNode) | null = null;
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    setOptions: (options: { headerRight?: () => React.ReactNode }) => {
      headerRightRenderer = options.headerRight ?? null;
    },
  }),
}));

jest.mock('expo-router', () => ({
  __esModule: true,
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  isAxiosError: jest.fn(() => false),
}));

jest.mock('@/lib/api/food', () => ({
  searchFoods: jest.fn(),
}));

jest.mock('@/lib/api/recipe', () => ({
  __esModule: true,
  createRecipe: jest.fn(),
  updateRecipe: jest.fn(),
  deleteRecipe: jest.fn(),
  getRecipe: jest.fn(),
}));

jest.mock('@expo/vector-icons/AntDesign', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedCreateRecipe = createRecipe as jest.MockedFunction<typeof createRecipe>;
const mockedIsAxiosError = isAxiosError as jest.MockedFunction<typeof isAxiosError>;
const mockedSearchFoods = searchFoods as jest.MockedFunction<typeof searchFoods>;
const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

const createFoodFixture = (): Food => {
  const measurements: FoodMeasurement[] = [];
  const food: Food = {
    id: 1,
    name: 'Almonds',
    brand: 'Acme Farms',
    calories: 100,
    protein: 10,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    saturatedFat: 0,
    transFat: 1,
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
    recipeFoods: [],
    measurements,
    createdAt: new Date(),
  };

  const measurement: FoodMeasurement = {
    id: 10,
    food,
    unit: 'oz',
    name: '1 oz',
    abbreviation: 'oz',
    weightInGrams: 28,
    isDefault: true,
    isActive: true,
    isFromSource: false,
  };

  measurements.push(measurement);

  return food;
};

describe('Recipe ingredient modal flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedUseColorScheme.mockReturnValue('light');
    mockedIsAxiosError.mockReturnValue(false);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    mockedSearchFoods.mockReset();
    mockedUseColorScheme.mockReset();
    mockedCreateRecipe.mockReset();
    mockedIsAxiosError.mockReset();
    mockReplace.mockReset();
    headerRightRenderer = null;
  });

  it('adds an ingredient after confirming the modal', async () => {
    const food = createFoodFixture();
    mockedSearchFoods.mockResolvedValue([food]);

    const { getAllByText, getByTestId, getByText, queryByText } = render(
      <PaperProvider>
        <Recipe />
      </PaperProvider>,
    );

    fireEvent.press(getByText('Add ingredient'));
    fireEvent.changeText(getByTestId('ingredient-search-input'), 'almonds');

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('search-result-subtext-1')).toHaveTextContent(
      'Acme Farms · 1 oz',
    );

    fireEvent.press(getByTestId('search-result-1'));

    expect(getByTestId('ingredient-details-content')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(queryByText('Trans fat')).toBeNull();
    expect(getByTestId('nutrition-expand-toggle')).toBeTruthy();

    fireEvent.press(getByTestId('nutrition-expand-toggle'));
    expect(getByText('Trans fat')).toBeTruthy();

    fireEvent.press(getByTestId('ingredient-add-button'));
    fireEvent.changeText(getByTestId('recipe-servings-input'), '2');

    const selectedIngredient = getByTestId('selected-ingredient-1');
    expect(selectedIngredient).toBeTruthy();
    expect(getByText('1 serving · 1 oz')).toBeTruthy();
    expect(within(selectedIngredient).getByText('28 cal')).toBeTruthy();
    expect(getByTestId('recipe-calorie-sum-value')).toHaveTextContent(
      '28 cal',
    );
    expect(getByTestId('recipe-calorie-sum-per-serving')).toHaveTextContent(
      '14 cal',
    );
    expect(getByText('Nutrition totals')).toBeTruthy();
    expect(getAllByText('Per serving').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Total recipe')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('1.4 g')).toBeTruthy();
    expect(getByText('2.8 g')).toBeTruthy();
    expect(queryByText('Trans fat')).toBeNull();
    fireEvent.press(getByTestId('recipe-nutrition-toggle'));
    expect(getByText('Trans fat')).toBeTruthy();
  });

  it('submits a new recipe', async () => {
    const food = createFoodFixture();
    mockedSearchFoods.mockResolvedValue([food]);
    mockedCreateRecipe.mockResolvedValueOnce({} as never);

    const { getByTestId, getByText } = render(
      <PaperProvider>
        <Recipe />
      </PaperProvider>,
    );

    fireEvent.press(getByText('Add ingredient'));
    fireEvent.changeText(getByTestId('ingredient-search-input'), 'almonds');

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('search-result-1'));
    fireEvent.press(getByTestId('ingredient-add-button'));

    fireEvent.changeText(getByTestId('recipe-title-input'), 'Almond bowl');
    fireEvent.changeText(getByTestId('recipe-servings-input'), '2');

    await act(async () => {});
    const header = render(<>{headerRightRenderer?.()}</>);
    await act(async () => {
      fireEvent.press(header.getByTestId('recipe-submit'));
    });

    expect(mockedCreateRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Almond bowl',
        servings: 2,
        ingredients: [
          expect.objectContaining({
            foodId: 1,
            servings: 1,
            measurementId: 10,
          }),
        ],
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith('/diary');
  });
});
