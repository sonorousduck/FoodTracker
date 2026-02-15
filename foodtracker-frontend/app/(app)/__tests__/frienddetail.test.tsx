import FriendDetail from "@/app/(app)/friend/[id]";
import { getFriendDiary, getFriendProfile, getFriendRecipes } from "@/lib/api/friends";
import { act, render } from "@testing-library/react-native";
import React from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => cb(), [cb]);
    },
    useLocalSearchParams: () => ({ id: "2" }),
  };
});

jest.mock("@/lib/api/friends", () => ({
  __esModule: true,
  getFriendDiary: jest.fn(),
  getFriendProfile: jest.fn(),
  getFriendRecipes: jest.fn(),
  importFriendRecipe: jest.fn(),
}));

jest.mock("@/lib/api/foodentry", () => ({
  __esModule: true,
  createFoodEntry: jest.fn(),
}));

jest.mock("react-native-modal-datetime-picker", () => "DateTimePickerModal");

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedGetFriendDiary = getFriendDiary as jest.MockedFunction<typeof getFriendDiary>;
const mockedGetFriendProfile = getFriendProfile as jest.MockedFunction<typeof getFriendProfile>;
const mockedGetFriendRecipes = getFriendRecipes as jest.MockedFunction<typeof getFriendRecipes>;
const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe("FriendDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseColorScheme.mockReturnValue("light");
  });

  it("renders friend header and tabs", async () => {
    mockedGetFriendProfile.mockResolvedValueOnce({
      id: 2,
      firstName: "Sam",
      lastName: "Duck",
      email: "sam@example.com",
    });
    mockedGetFriendDiary.mockResolvedValueOnce([]);
    mockedGetFriendRecipes.mockResolvedValueOnce([]);

    const screen = render(
      <PaperProvider>
        <FriendDetail />
      </PaperProvider>
    );
    await act(async () => {});

    expect(screen.getByText("Sam Duck")).toBeTruthy();
    expect(screen.getByText("Day log")).toBeTruthy();
    expect(screen.getByText("Search recipes")).toBeTruthy();
  });
});
