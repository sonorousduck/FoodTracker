import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Weight } from "@/types/weight/weight";
import { useFont } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { View } from "react-native";
import { CartesianChart, Line } from "victory-native";

type ChartDatum = {
	timestamp: number;
	weightEntry: number;
};

const formatDateLabel = (value: unknown) => {
	const date = new Date(typeof value === "number" ? value : String(value));
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatWeightLabel = (value: unknown) => {
	const numeric = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(numeric)) {
		return "";
	}
	return numeric.toFixed(1);
};

export default function WeightChart({
	weights,
	height = 220,
}: {
	weights: ReadonlyArray<Weight>;
	height?: number;
}) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const font = useFont(require("../assets/fonts/SpaceMono-Regular.ttf"), 10);
	const data = useMemo<ChartDatum[]>(
		() =>
			weights
				.map((entry) => ({
					timestamp: (entry.date instanceof Date
						? entry.date
						: new Date(entry.date)
					).getTime(),
					weightEntry: entry.weightEntry,
				}))
				.sort((left, right) => left.timestamp - right.timestamp),
		[weights]
	);

	if (data.length === 0) {
		return null;
	}

	return (
		<View style={{ height }}>
			<CartesianChart
				data={data}
				xKey="timestamp"
				yKeys={["weightEntry"]}
				padding={24}
				xAxis={{
					tickCount: Math.min(2, data.length),
					labelColor: colors.text,
					lineColor: colors.modalSecondary,
					formatXLabel: formatDateLabel,
					font,
				}}
				yAxis={[
					{
						tickCount: 4,
						labelColor: colors.text,
						lineColor: colors.modalSecondary,
						formatYLabel: formatWeightLabel,
						font,
					},
				]}
			>
				{({ points }) => (
					<>
						<Line
							points={points.weightEntry}
							color={colors.tint}
							strokeWidth={2}
						/>
					</>
				)}
			</CartesianChart>
		</View>
	);
}
