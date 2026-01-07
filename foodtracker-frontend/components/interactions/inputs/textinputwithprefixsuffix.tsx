import ThemedText from "@/components/themedtext";
import {
	InputModeOptions,
	KeyboardTypeOptions,
	StyleSheet,
	TextInput,
	View,
	useColorScheme,
} from "react-native";
import { Colors } from "@/constants/Colors";

interface InputContainerProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	unit: string;
	error?: string;
	editable?: boolean;
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
	error,
	editable = true,
	inputMode = "text",
	keyboardType = "default",
	maxLength,
	enterKeyHint = "done",
}: InputContainerProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const borderColor = error ? "#FF3B30" : colors.modalSecondary;

	return (
		<View
			style={[
				styles.inputContainer,
				{
					backgroundColor: colors.modal,
					borderColor,
				},
			]}
		>
			<ThemedText style={[styles.text, { color: colors.text }]}>
				{label}
			</ThemedText>
			<TextInput
				style={[styles.input, { color: colors.text }]}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.icon}
				enterKeyHint={enterKeyHint}
				inputMode={inputMode}
				keyboardType={keyboardType}
				maxLength={maxLength}
				editable={editable}
			/>
			<ThemedText
				style={[
					styles.text,
					{ justifyContent: "flex-end", color: colors.text },
				]}
			>
				{unit}
			</ThemedText>
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
