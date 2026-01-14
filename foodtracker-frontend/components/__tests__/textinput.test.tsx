import DuckTextInput from '@/components/interactions/inputs/textinput';
import { Colors } from '@/constants/Colors';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import useColorScheme from 'react-native/Libraries/Utilities/useColorScheme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>;

describe('DuckTextInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    mockedUseColorScheme.mockReset();
  });

  it('uses dark mode colors for text and placeholder', () => {
    mockedUseColorScheme.mockReturnValue('dark');

    const { getByPlaceholderText } = render(
      <DuckTextInput placeholder="Email" value="" onChangeText={jest.fn()} />,
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    const input = getByPlaceholderText('Email');
    const inputStyle = StyleSheet.flatten(input.props.style);

    expect(inputStyle.color).toBe(Colors.dark.text);
    expect(input.props.placeholderTextColor).toBe(Colors.dark.icon);
    expect(input.props.selectionColor).toBe(Colors.dark.tint);
  });
});
