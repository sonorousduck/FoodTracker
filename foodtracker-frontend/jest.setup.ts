import "@testing-library/jest-native/extend-expect";
import { Animated } from "react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock(
  "react-native/Libraries/Animated/NativeAnimatedHelper",
  () => ({}),
  { virtual: true }
);

const mockAnimation = {
  start: (callback?: (result: Animated.EndResult) => void) => {
    callback?.({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
} satisfies Animated.CompositeAnimation;

jest.spyOn(Animated, "timing").mockImplementation(() => mockAnimation);
jest.spyOn(Animated, "spring").mockImplementation(() => mockAnimation);
