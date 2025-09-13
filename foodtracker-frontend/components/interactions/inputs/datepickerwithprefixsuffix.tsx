import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface DatePickerWithPrefixSuffixProps {
	label: string;
	value: Date;
	onChange: (date: Date) => void;
	unit?: string;
	showPicker: boolean;
	setShowPicker: (show: boolean) => void;
}

export default function DatePickerWithPrefixSuffix({
	label,
	value,
	onChange,
	unit = "",
	showPicker,
	setShowPicker,
}: DatePickerWithPrefixSuffixProps) {
	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			month: "2-digit",
			day: "2-digit",
			year: "numeric",
		});
	};

	const handlePress = () => {
		setShowPicker(true);
	};

	const hideDatePicker = () => {
		setShowPicker(false);
	};

	const handleConfirm = (date: Date) => {
		onChange(date);
		hideDatePicker();
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={styles.inputContainer}
				onPress={handlePress}
				activeOpacity={0.7}
			>
				<Text style={[styles.text, styles.header]}>{label}</Text>
				<Text style={[styles.text, styles.dateText]}>{formatDate(value)}</Text>
			</TouchableOpacity>

			{showPicker && (
				<DateTimePickerModal
					isVisible={showPicker}
					mode="date"
					onConfirm={handleConfirm}
					onCancel={hideDatePicker}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {},
	inputContainer: {
		height: 40,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#f9f9f9",
		paddingHorizontal: 16,
		borderRadius: 12,
		justifyContent: "center",
		flexDirection: "row",
	},
	text: {
		display: "flex",
		alignSelf: "center",
		marginLeft: 4,
	},
	header: {},
	dateText: {
		flex: 1,
		flexGrow: 1,
		textAlign: "right",
		justifyContent: "flex-end",
	},
});
