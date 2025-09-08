import DuckTextInput from "@/components/interactions/inputs/textinput";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackWeight() {
	const [weight, setWeight] = useState("");

	return (
		<SafeAreaView style={{ paddingTop: 48, padding: 8 }}>
			<DuckTextInput
				value={weight}
				onChangeText={setWeight}
				placeholder="Weight"
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	input: {},
});
