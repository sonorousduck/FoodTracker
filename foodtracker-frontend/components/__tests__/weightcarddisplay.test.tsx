import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import WeightCardDisplay from "@/components/weightcarddisplay";
import { getWeights } from "@/lib/api/getweights";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api/getweights", () => ({
  __esModule: true,
  getWeights: jest.fn(),
}));

jest.mock("@/components/weightchart", () => ({
  __esModule: true,
  default: () => null,
}));

describe("WeightCardDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a tappable empty state that routes to add weight", async () => {
    const mockedGetWeights = getWeights as jest.MockedFunction<typeof getWeights>;
    mockedGetWeights.mockResolvedValueOnce([]);

    const screen = render(
      <PaperProvider>
        <WeightCardDisplay />
      </PaperProvider>
    );

    await act(async () => {});

    expect(screen.getByText("Log a weight to see your chart.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("weight-empty-state-action"));

    expect(mockPush).toHaveBeenCalledWith("/trackweight");
  });
});
