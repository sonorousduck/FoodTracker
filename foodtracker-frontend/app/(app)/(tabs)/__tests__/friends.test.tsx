import FriendsTab from "@/app/(app)/(tabs)/friends";
import {
  acceptFriendRequest,
  getFriends,
  getPendingFriendRequests,
  rejectFriendRequest,
  requestFriend,
  searchFriends,
} from "@/lib/api/friends";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { useColorScheme } from "react-native";

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => cb(), [cb]);
    },
    useRouter: () => ({ push: jest.fn() }),
  };
});

jest.mock("@/lib/api/friends", () => ({
  __esModule: true,
  acceptFriendRequest: jest.fn(),
  getFriends: jest.fn(),
  getPendingFriendRequests: jest.fn(),
  rejectFriendRequest: jest.fn(),
  requestFriend: jest.fn(),
  searchFriends: jest.fn(),
}));

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedGetFriends = getFriends as jest.MockedFunction<typeof getFriends>;
const mockedGetPendingFriendRequests =
  getPendingFriendRequests as jest.MockedFunction<typeof getPendingFriendRequests>;
const mockedSearchFriends = searchFriends as jest.MockedFunction<typeof searchFriends>;

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe("FriendsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseColorScheme.mockReturnValue("light");
  });

  it("renders empty states", async () => {
    mockedGetFriends.mockResolvedValueOnce([]);
    mockedGetPendingFriendRequests.mockResolvedValueOnce([]);

    const screen = render(<FriendsTab />);
    await act(async () => {});

    expect(screen.getByText("Friends")).toBeTruthy();
    expect(screen.getByText("No friends yet.")).toBeTruthy();
    expect(screen.getByText("No pending requests.")).toBeTruthy();
  });

  it("searches by name and shows results", async () => {
    mockedGetFriends.mockResolvedValueOnce([]);
    mockedGetPendingFriendRequests.mockResolvedValueOnce([]);
    mockedSearchFriends.mockResolvedValueOnce([
      { id: 2, firstName: "Sam", lastName: "Duck", email: "sam@example.com" },
    ]);

    const screen = render(<FriendsTab />);
    await act(async () => {});

    fireEvent.changeText(screen.getByTestId("friends-first-name"), "Sam");
    fireEvent.press(screen.getByTestId("friends-search"));

    await act(async () => {});

    expect(screen.getByText("Sam Duck")).toBeTruthy();
    expect(screen.getByText("sam@example.com")).toBeTruthy();
  });
});
