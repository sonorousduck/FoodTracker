import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import React from "react";
import { View, useColorScheme } from "react-native";

interface WebDatePickerProps {
	label: string;
	value: Date;
	onChange: (date: Date) => void;
	error?: string;
	disabled?: boolean;
}

const WebDatePicker: React.FC<WebDatePickerProps> = ({
	label,
	value,
	onChange,
	error,
	disabled = false,
}) => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const borderColor = error ? "#FF3B30" : colors.modalSecondary;

	const formatDateForInput = (date: Date): string => {
		return date.toISOString().split("T")[0];
	};

	const handleDateChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		const newDate: Date = new Date(event.target.value);
		onChange(newDate);
	};

	return (
		<View
			style={{
				height: 40,
				borderWidth: 1,
				borderColor,
				backgroundColor: colors.modal,
				paddingHorizontal: 16,
				borderRadius: 12,
				justifyContent: "center",
				flexDirection: "row",
				opacity: disabled ? 0.6 : 1,
			}}
		>
			<ThemedText
				style={{
					alignContent: "center",
					flexGrow: 1,
					color: colors.text,
				}}
			>
				{label}
			</ThemedText>
			<input
				type="date"
				value={formatDateForInput(value)}
				onChange={handleDateChange}
				disabled={disabled}
				style={{
					outline: "none",
					border: "none",
					textAlign: "center",
					justifySelf: "center",
					fontFamily: "system-ui, -apple-system, sans-serif",
					backgroundColor: "transparent",
					color: colors.text,
				}}
			/>
		</View>
	);
};

export default WebDatePicker;
