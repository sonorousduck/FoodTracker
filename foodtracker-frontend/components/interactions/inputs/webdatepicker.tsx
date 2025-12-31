import React from "react";
import { Text, View, useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

interface WebDatePickerProps {
	label: string;
	value: Date;
	onChange: (date: Date) => void;
}

const WebDatePicker: React.FC<WebDatePickerProps> = ({
	label,
	value,
	onChange,
}) => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

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
				borderColor: colors.modalSecondary,
				backgroundColor: colors.modal,
				paddingHorizontal: 16,
				borderRadius: 12,
				justifyContent: "center",
				flexDirection: "row",
			}}
		>
			<Text
				style={{
					alignContent: "center",
					flexGrow: 1,
					color: colors.text,
				}}
			>
				{label}
			</Text>
			<input
				type="date"
				value={formatDateForInput(value)}
				onChange={handleDateChange}
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
