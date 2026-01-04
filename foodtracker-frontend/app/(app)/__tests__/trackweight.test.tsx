import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import TrackWeight from "../trackweight";
import { createWeight } from "@/lib/api/weight";

let headerRightRenderer: (() => React.ReactNode) | null = null;

const mockReplace = jest.fn();

jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		setOptions: (options: { headerRight?: () => React.ReactNode }) => {
			headerRightRenderer = options.headerRight ?? null;
		},
	}),
}));

jest.mock("expo-router", () => ({
	__esModule: true,
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/lib/api", () => ({
	__esModule: true,
	isAxiosError: jest.fn(() => false),
}));

jest.mock("@/lib/api/weight", () => ({
	__esModule: true,
	createWeight: jest.fn(),
}));

jest.mock("@expo/vector-icons/AntDesign", () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
	SafeAreaView: ({ children }: { children?: React.ReactNode }) => (
		<>{children}</>
	),
}));

jest.mock("react-native-modal-datetime-picker", () => {
	return () => null;
});


describe("TrackWeight", () => {
	beforeEach(() => {
		headerRightRenderer = null;
		jest.clearAllMocks();
	});

	it("submits a valid weight entry", async () => {
		const mockCreateWeight = createWeight as jest.MockedFunction<
			typeof createWeight
		>;
		mockCreateWeight.mockResolvedValueOnce({} as never);

		const screen = render(<TrackWeight />);
		await act(async () => {});

		const weightInput = screen.getByPlaceholderText("170.0");
		await act(async () => {
			fireEvent.changeText(weightInput, "170.5");
		});
		await act(async () => {});
		expect(screen.getByPlaceholderText("170.0").props.value).toBe("170.5");

		await act(async () => {
			screen.rerender(<TrackWeight />);
		});
		const header = render(<>{headerRightRenderer?.()}</>);

		const readyButton = header.getByTestId("trackweight-submit");
		await act(async () => {
			fireEvent.press(readyButton);
		});

		expect(mockCreateWeight).toHaveBeenCalledWith(
			expect.objectContaining({
				weightEntry: 170.5,
				date: expect.any(Date),
			})
		);
		expect(mockReplace).toHaveBeenCalledWith({
			pathname: "/",
			params: { toast: "Weight saved", toastType: "success" },
		});
	});
});
