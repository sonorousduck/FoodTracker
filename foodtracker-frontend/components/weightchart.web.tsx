import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Weight } from "@/types/weight/weight";
import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import {
	VictoryAxis,
	VictoryChart,
	VictoryLine,
	VictoryScatter,
} from "victory";

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

export default function WeightChartWeb({
	weights,
	height = 256,
}: {
	weights: ReadonlyArray<Weight>;
	height?: number;
}) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const { width } = useWindowDimensions();
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

	const chartWidth = width - 256;

	return (
		<View>
			<VictoryChart
				animate={true}
				width={chartWidth}
				height={height}
				padding={{ top: 16, left: 48, right: 48, bottom: 32 }}
			>
				<VictoryAxis
					tickFormat={(value) => formatDateLabel(value)}
					style={{
						axis: { stroke: colors.text },
						ticks: { stroke: colors.text },
						tickLabels: { fill: colors.text, fontSize: 10 },
						grid: { stroke: colors.modalSecondary },
					}}
				/>
				<VictoryAxis
					dependentAxis
					tickFormat={(value) => formatWeightLabel(value)}
					style={{
						axis: { stroke: colors.text },
						ticks: { stroke: colors.text },
						tickLabels: { fill: colors.text, fontSize: 10 },
						grid: { stroke: colors.modalSecondary },
					}}
				/>
				<VictoryLine
					data={data}
					x="timestamp"
					y="weightEntry"
					style={{ data: { stroke: colors.tint, strokeWidth: 2 } }}
				/>
				<VictoryScatter
					data={data}
					x="timestamp"
					y="weightEntry"
					style={{ data: { fill: colors.tabIconSelected } }}
					size={3}
				/>
			</VictoryChart>
		</View>
	);
}
