import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { View, useColorScheme } from "react-native";

interface WebDatePickerProps {
	label: string;
	value: Date;
	onChange: (date: Date) => void;
	error?: string;
	disabled?: boolean;
	/** Force the calendar popup open (controlled mode for diary-style trigger buttons) */
	open?: boolean;
	/** Called when the calendar is dismissed */
	onClose?: () => void;
}

const WebDatePicker: React.FC<WebDatePickerProps> = ({
	label,
	value,
	onChange,
	error,
	disabled = false,
	open,
	onClose,
}) => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const borderColor = error ? "#FF3B30" : colors.modalSecondary;

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
				alignItems: "center",
				opacity: disabled ? 0.6 : 1,
			}}
		>
			{label ? (
				<ThemedText
					style={{
						flexGrow: 1,
						color: colors.text,
					}}
				>
					{label}
				</ThemedText>
			) : null}
			<DatePicker
				selected={value}
				onChange={(date) => {
					if (date) {
						onChange(date);
						onClose?.();
					}
				}}
				disabled={disabled}
				dateFormat="MM/dd/yyyy"
				open={open}
				onClickOutside={onClose}
				portalId="datepicker-portal"
				popperProps={{ strategy: "fixed" }}
				customInput={
					<input
						style={{
							backgroundColor: "transparent",
							border: "none",
							outline: "none",
							color: colors.text,
							fontFamily: "system-ui, -apple-system, sans-serif",
							fontSize: 14,
							cursor: disabled ? "not-allowed" : "pointer",
							textAlign: "center",
							flexGrow: label ? 0 : 1,
						}}
					/>
				}
			/>
		</View>
	);
};

export default WebDatePicker;
