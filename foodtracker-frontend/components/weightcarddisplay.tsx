import ThemedText from "@/components/themedtext";
import WeightChart from "@/components/weightchart";
import { getWeights } from "@/lib/api/getweights";
import { normalizeWeightsByDay } from "@/lib/weights/normalizeweights";
import { Weight } from "@/types/weight/weight";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";

export default function WeightCardDisplay() {
	const [weights, setWeights] = useState<ReadonlyArray<Weight>>([]);
	const router = useRouter();

	useEffect(() => {
		async function getUserWeights() {
			const weights = await getWeights({});

			setWeights(weights);
		}

		getUserWeights();
	}, []);

	const normalizedWeights = normalizeWeightsByDay(weights);
	const hasWeights = normalizedWeights.length > 0;

	return (
		<Card mode="elevated" style={styles.card}>
			<View style={styles.content}>
				<ThemedText style={styles.title}>Weight trend</ThemedText>
				{hasWeights ? (
					<WeightChart weights={normalizedWeights} />
				) : (
					<Pressable
						testID="weight-empty-state-action"
						accessibilityRole="button"
						onPress={() => router.push("/trackweight")}
						style={styles.emptyState}
					>
						<ThemedText style={styles.emptyStateTitle}>
							Log a weight to see your chart.
						</ThemedText>
						<ThemedText style={styles.emptyStateHint}>
							Tap to add your first entry.
						</ThemedText>
					</Pressable>
				)}
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: {
		alignSelf: "center",
		width: "90%",
		marginHorizontal: 16,
	},
	content: {
		padding: 16,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		gap: 8,
	},
	emptyState: {
		marginTop: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.15)",
		paddingVertical: 18,
		paddingHorizontal: 14,
		alignItems: "center",
	},
	emptyStateTitle: {
		fontSize: 14,
		opacity: 0.7,
		textAlign: "center",
	},
	emptyStateHint: {
		fontSize: 13,
		opacity: 0.6,
		marginTop: 6,
		textAlign: "center",
	},
});
