import ThemedText from "@/components/themedtext";
import WeightChart from "@/components/weightchart";
import { getWeights } from "@/lib/api/getweights";
import { normalizeWeightsByDay } from "@/lib/weights/normalizeweights";
import { Weight } from "@/types/weight/weight";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";

export default function WeightCardDisplay() {
	const [weights, setWeights] = useState<ReadonlyArray<Weight>>([]);

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
					<ThemedText style={styles.emptyState}>
						Log a weight to see your chart.
					</ThemedText>
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
		fontSize: 14,
		opacity: 0.7,
	},
});
