import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import { StyleSheet, useColorScheme } from "react-native";

import TouchableWithFeedback, {
	TouchableWithFeedbackProps,
} from "./touchablewithfeedback";

interface AddModalPrimaryActionProps extends TouchableWithFeedbackProps {
	children?: React.ReactNode;
}

export default function AddModalPrimaryAction({
	children,
	style,
	...props
}: AddModalPrimaryActionProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const isDark = colorScheme === "dark";

	return (
		<TouchableWithFeedback
			style={[
				styles.button,
				{
					backgroundColor: colors.modal,
					borderColor: colors.modalSecondary,
					shadowColor: isDark ? "#000000" : "#000000",
					shadowOpacity: isDark ? 0.35 : 0.12,
				},
				style,
			]}
			{...props}
		>
			{children || <ThemedText>Unused</ThemedText>}
		</TouchableWithFeedback>
	);
}

const styles = StyleSheet.create({
	button: {
		height: 120,
		minWidth: 120,
		borderWidth: 1,
		borderRadius: 16,
		justifyContent: "center",
		alignContent: "center",
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 8,
		elevation: 4,
	},
});
