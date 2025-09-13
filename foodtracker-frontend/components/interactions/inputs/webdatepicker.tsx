import React from "react";
import { Text, View } from "react-native";

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
				borderColor: "#ddd",
				backgroundColor: "#f9f9f9",
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
				}}
			/>
		</View>
	);
};

export default WebDatePicker;
