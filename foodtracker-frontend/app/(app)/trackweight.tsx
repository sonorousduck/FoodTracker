import DatePickerWithPrefixSuffix from "@/components/interactions/inputs/datepickerwithprefixsuffix";
import TextInputWithPrefixSuffix from "@/components/interactions/inputs/textinputwithprefixsuffix";
import WebDatePicker from "@/components/interactions/inputs/webdatepicker";
import { Colors } from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { Platform, Pressable, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackWeight() {
	const [weight, setWeight] = useState("");
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const navigation = useNavigation();
	const colorScheme = useColorScheme();

	const handlePress = () => {
		if (showDatePicker) {
			setShowDatePicker(false);
		}
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<AntDesign
					name="check-circle"
					size={24}
					color={Colors[colorScheme ?? "light"].tint}
					style={Platform.OS === "web" && { marginRight: 64 }}
				/>
			),
		});
	}, [navigation, colorScheme]);

	return (
		<SafeAreaView
			style={{ paddingTop: 48, padding: 8, alignContent: "center" }}
		>
			<Pressable
				style={{
					height: "100%",
					gap: 8,
					maxWidth: 1024,
					width: "100%",
					alignSelf: "center",
					flexGrow: 1,
				}}
				onPress={handlePress}
			>
				<TextInputWithPrefixSuffix
					label="Weight"
					value={weight}
					onChangeText={setWeight}
					placeholder="170.0"
					unit="lbs"
					inputMode="decimal"
					keyboardType="decimal-pad"
					maxLength={5}
					enterKeyHint="next"
				/>
				{Platform.OS === "web" ? (
					<WebDatePicker label="Date" value={date} onChange={setDate} />
				) : (
					<DatePickerWithPrefixSuffix
						label="Date"
						value={date}
						onChange={setDate}
						showPicker={showDatePicker}
						setShowPicker={setShowDatePicker}
					/>
				)}
			</Pressable>
		</SafeAreaView>
	);
}
