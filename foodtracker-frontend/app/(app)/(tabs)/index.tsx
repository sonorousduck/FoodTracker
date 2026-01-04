import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Snackbar } from "react-native-paper";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

type ToastType = "success" | "error";

export default function Tab() {
	const { toast, toastType } = useLocalSearchParams<{
		toast?: string;
		toastType?: string;
	}>();
	const router = useRouter();
	const [showToast, setShowToast] = useState(false);
	const [toastText, setToastText] = useState("");
	const [toastKind, setToastKind] = useState<ToastType>("success");
	const insets = useSafeAreaInsets();
	const toastOffset = insets.bottom + 64;
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const toastMessage = Array.isArray(toast) ? toast[0] : toast;
	const toastTypeValue = Array.isArray(toastType) ? toastType[0] : toastType;

	useFocusEffect(
		useCallback(() => {
			if (!toastMessage) {
				return;
			}

			setToastText(toastMessage);
			setToastKind(toastTypeValue === "error" ? "error" : "success");
			setShowToast(true);
			router.setParams({ toast: undefined, toastType: undefined });
		}, [toastMessage, toastTypeValue, router])
	);

	const toastEmoji = toastKind === "error" ? "❌" : "✅";

	return (
		<SafeAreaView style={styles.container}>
			<Text>Dashboard</Text>
			<Snackbar
				visible={showToast}
				onDismiss={() => setShowToast(false)}
				duration={2200}
				style={{ marginBottom: toastOffset }}
				contentStyle={{ alignItems: "center" }}
				theme={{
					colors: {
						inverseSurface: colors.modal,
						inverseOnSurface: colors.text,
						onSurface: colors.text,
						surface: colors.modal,
					},
				}}
			>
				<Text style={{ color: colors.text, textAlign: "center", width: "100%" }}>
					{toastEmoji} {toastText}
				</Text>
			</Snackbar>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
	},
});
