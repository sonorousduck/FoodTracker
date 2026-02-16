import Dashboard from '@/app/(app)/(tabs)/index';
import { getDiaryEntries } from '@/lib/api/foodentry';
import { getCurrentGoals } from '@/lib/api/goal';
import { GoalType } from '@/types/goal/goaltype';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { PaperProvider } from 'react-native-paper';

const mockPush = jest.fn();
const mockSetParams = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => cb(), [cb]);
    },
    useLocalSearchParams: () => ({}),
    useRouter: () => ({
      push: mockPush,
      setParams: mockSetParams,
    }),
  };
});

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/components/weightcarddisplay', () => () => null);

jest.mock('@/lib/api/foodentry', () => ({
  __esModule: true,
  getDiaryEntries: jest.fn(),
}));

jest.mock('@/lib/api/goal', () => ({
  __esModule: true,
  getCurrentGoals: jest.fn(),
}));

const mockedGetDiaryEntries = getDiaryEntries as jest.MockedFunction<
  typeof getDiaryEntries
>;
const mockedGetCurrentGoals = getCurrentGoals as jest.MockedFunction<
  typeof getCurrentGoals
>;

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calorie chart and summary when calorie goal exists', async () => {
    mockedGetDiaryEntries.mockResolvedValue([
      {
        id: 1,
        servings: 2,
        food: {
          calories: 100,
          measurements: [],
        },
      } as never,
    ]);
    mockedGetCurrentGoals.mockResolvedValue({
      [GoalType.Calorie]: {
        id: 1,
        name: 'Calorie Goal',
        value: 2000,
        goalType: GoalType.Calorie,
        user: {} as never,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-01-02T00:00:00.000Z'),
        createdDate: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    const screen = render(
      <PaperProvider>
        <Dashboard />
      </PaperProvider>,
    );

    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-calorie-chart')).toBeTruthy();
      expect(screen.getByTestId('dashboard-calorie-summary')).toHaveTextContent(
        '200 / 2000 cal',
      );
      expect(screen.getByText('1800 cal left')).toBeTruthy();
    });
  });

  it('renders zero state and routes to goals when no calorie goal exists', async () => {
    mockedGetDiaryEntries.mockResolvedValue([]);
    mockedGetCurrentGoals.mockResolvedValue({});

    const screen = render(
      <PaperProvider>
        <Dashboard />
      </PaperProvider>,
    );

    await act(async () => {});

    const cta = await screen.findByTestId('dashboard-goals-cta');
    expect(screen.getByText('Set a calorie goal to track progress for the day.')).toBeTruthy();

    fireEvent.press(cta);
    expect(mockPush).toHaveBeenCalledWith('/goals');
  });
});
