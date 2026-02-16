import React from "react";
import TabLayout from "@/app/(app)/(tabs)/_layout";
import { render } from "@testing-library/react-native";

type ScreenProps = {
  name: string;
  options?: {
    href?: string | null;
  };
};

jest.mock("expo-router", () => ({
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Screen: (props: ScreenProps) => {
        (
          jest.requireMock("expo-router") as {
            __capturedScreens: ScreenProps[];
          }
        ).__capturedScreens.push(props);
        return null;
      },
    }
  ),
  __capturedScreens: [] as ScreenProps[],
}));

jest.mock("@/components/HapticTab", () => ({
  __esModule: true,
  HapticTab: () => null,
}));

jest.mock("@/components/interactions/buttons/addbutton", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/ui/TabBarBackground", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@expo/vector-icons", () => ({
  __esModule: true,
  AntDesign: () => null,
  Ionicons: () => null,
}));

jest.mock("@react-native-vector-icons/lucide", () => ({
  __esModule: true,
  Lucide: () => null,
}));

jest.mock("@react-native-vector-icons/octicons", () => ({
  __esModule: true,
  Octicons: () => null,
}));

describe("TabLayout", () => {
  beforeEach(() => {
    (
      jest.requireMock("expo-router") as {
        __capturedScreens: ScreenProps[];
      }
    ).__capturedScreens.length = 0;
  });

  it("keeps friends route hidden from the tab bar", () => {
    render(<TabLayout />);

    const friendsScreen = (
      jest.requireMock("expo-router") as {
        __capturedScreens: ScreenProps[];
      }
    ).__capturedScreens.find(
      (screen) => screen.name === "friends"
    );

    expect(friendsScreen).toBeDefined();
    expect(friendsScreen?.options?.href).toBeNull();
  });
});
