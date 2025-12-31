import { fireEvent, render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { HapticTab } from "../HapticTab";
import * as Haptics from "expo-haptics";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";

const createProps = (
  overrides: Partial<BottomTabBarButtonProps> = {},
): BottomTabBarButtonProps => ({
  children: null,
  accessibilityRole: "button",
  testID: "haptic-tab",
  onPressIn: jest.fn(),
  ...overrides,
});

const renderWithNavigation = (props: BottomTabBarButtonProps) =>
  render(
    <NavigationContainer>
      <HapticTab {...props} />
    </NavigationContainer>,
  );

describe("HapticTab", () => {
  const originalPlatformOs = Platform.OS;

  const setPlatformOs = (value: string) => {
    Object.defineProperty(Platform, "OS", {
      value,
      configurable: true,
    });
  };

  afterEach(() => {
    setPlatformOs(originalPlatformOs);
    jest.clearAllMocks();
  });

  it("triggers haptics on iOS press-in", () => {
    setPlatformOs("ios");
    const props = createProps();
    const { getByTestId } = renderWithNavigation(props);

    fireEvent(getByTestId("haptic-tab"), "pressIn");

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light,
    );
    expect(props.onPressIn).toHaveBeenCalled();
  });

  it("skips haptics on non-iOS press-in", () => {
    setPlatformOs("android");
    const props = createProps();
    const { getByTestId } = renderWithNavigation(props);

    fireEvent(getByTestId("haptic-tab"), "pressIn");

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(props.onPressIn).toHaveBeenCalled();
  });
});
