import {
	InputModeOptions,
	KeyboardTypeOptions,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

interface InputContainerProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	unit: string;
	inputMode?: InputModeOptions;
	keyboardType?: KeyboardTypeOptions;
	maxLength?: number;
	enterKeyHint?: "done" | "go" | "next" | "previous" | "search" | "send";
}

function TextInputWithPrefixSuffix({
	label,
	value,
	onChangeText,
	placeholder,
	unit,
	inputMode = "text",
	keyboardType = "default",
	maxLength,
	enterKeyHint = "done",
}: InputContainerProps) {
	return (
		<View style={styles.inputContainer}>
			<Text style={[styles.text]}>{label}</Text>
			<TextInput
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				enterKeyHint={enterKeyHint}
				inputMode={inputMode}
				keyboardType={keyboardType}
				maxLength={maxLength}
			/>
			<Text style={[styles.text, { justifyContent: "flex-end" }]}>{unit}</Text>
		</View>
	);
}
const styles = StyleSheet.create({
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

	input: {
		textAlign: "right",
		flexGrow: 1,
	},
	text: {
		alignSelf: "center",
		marginLeft: 4,
	},
});

export default TextInputWithPrefixSuffix;
