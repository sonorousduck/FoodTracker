import Recipes from '@/app/(app)/recipes';
import { getRecipes } from '@/lib/api/recipe';
import { Recipe } from '@/types/recipe/recipe';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

const mockPush = jest.fn();

jest.mock('expo-router', () => {
  const react = jest.requireActual('react');
  return {
    __esModule: true,
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (callback: () => void) => {
      react.useEffect(callback, []);
    },
  };
});

jest.mock('@/lib/api/recipe', () => ({
  __esModule: true,
  getRecipes: jest.fn(),
}));

const mockedGetRecipes = getRecipes as jest.MockedFunction<typeof getRecipes>;

describe('Recipes list', () => {
  beforeEach(() => {
    mockedGetRecipes.mockResolvedValue([
      {
        id: 1,
        title: 'Protein bowl',
        servings: 2,
        ingredients: [],
      } as Recipe,
    ]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    mockedGetRecipes.mockReset();
    mockPush.mockReset();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('navigates to a recipe when pressed', async () => {
    const { findByTestId } = render(<Recipes />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    const listItem = await findByTestId('recipe-list-item-1');
    fireEvent.press(listItem);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/recipe',
      params: { id: '1' },
    });
  });
});
