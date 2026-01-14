import DatePickerWithPrefixSuffix from "@/components/interactions/inputs/datepickerwithprefixsuffix";
import TextInputWithPrefixSuffix from "@/components/interactions/inputs/textinputwithprefixsuffix";
import WebDatePicker from "@/components/interactions/inputs/webdatepicker";
import { Colors } from "@/constants/Colors";
import { isAxiosError } from "@/lib/api";
import { createWeight } from "@/lib/api/weight";
import { CreateWeightDto } from "@/types/weight/createweight";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
        ActivityIndicator,
        Alert,
        Platform,
        Pressable,
        TouchableOpacity,
        View,
        useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackWeight() {
        const [weight, setWeight] = useState("");
        const [date, setDate] = useState(new Date());
        const [showDatePicker, setShowDatePicker] = useState(false);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [errors, setErrors] = useState<{ weight?: string; date?: string }>({});
        const navigation = useNavigation();
        const router = useRouter();
        const colorScheme = useColorScheme();

        const handlePress = () => {
                if (showDatePicker) {
                        setShowDatePicker(false);
                }
        };

        const parsedWeight = Number.parseFloat(weight.trim());
        const isWeightValid = Number.isFinite(parsedWeight) && parsedWeight > 0;
        const isDateValid = Number.isFinite(date.getTime());
        const canSubmit = isWeightValid && isDateValid && !isSubmitting;

        const handleWeightChange = useCallback(
                (value: string) => {
                        setWeight(value);
                        if (errors.weight) {
                                setErrors((prev) => ({ ...prev, weight: undefined }));
                        }
                },
                [errors.weight]
        );

        const handleDateChange = useCallback(
                (nextDate: Date) => {
                        setDate(nextDate);
                        if (errors.date) {
                                setErrors((prev) => ({ ...prev, date: undefined }));
                        }
                },
                [errors.date]
        );

        const validateInputs = useCallback(() => {
                const nextErrors: { weight?: string; date?: string } = {};

                if (!weight.trim()) {
                        nextErrors.weight = "Weight is required";
                } else if (!isWeightValid) {
                        nextErrors.weight = "Enter a valid weight";
                }

                if (!isDateValid) {
                        nextErrors.date = "Select a valid date";
                }

                setErrors(nextErrors);
                return Object.keys(nextErrors).length === 0;
        }, [weight, isWeightValid, isDateValid]);

        const handleSubmit = useCallback(async () => {
                if (isSubmitting) {
                        return;
                }

                if (!validateInputs()) {
                        return;
                }

                setIsSubmitting(true);

                try {
                        const payload: CreateWeightDto = {
                                weightEntry: parsedWeight,
                                date,
                        };

                        await createWeight(payload);

                        setWeight("");
                        setDate(new Date());
                        setErrors({});

                        router.replace({
                                pathname: "/",
                                params: { toast: "Weight saved", toastType: "success" },
                        });
                } catch (error) {
                        const message = isAxiosError(error)
                                ? error.response?.data?.message || error.message
                                : "Failed to save weight entry";
                        Alert.alert("Error", message);
                } finally {
                        setIsSubmitting(false);
                }
        }, [date, isSubmitting, parsedWeight, router, validateInputs]);

        useLayoutEffect(() => {
                navigation.setOptions({
                        headerRightContainerStyle: [
                                {
                                        backgroundColor: "transparent",
                                        paddingRight: Platform.OS === "web" ? 64 : 16,
                                },
                                Platform.OS === "web"
                                        ? null
                                        : { alignItems: "center", justifyContent: "center" },
                        ],
                        headerRight: () => (
                                <View
                                        style={{
                                                width: 32,
                                                height: 32,
                                                alignItems: "center",
                                                justifyContent: "center",
                                        }}
                                >
                                        {isSubmitting ? (
                                                <ActivityIndicator
                                                        size="small"
                                                        color={Colors[colorScheme ?? "light"].tint}
                                                />
                                        ) : (
                                                <TouchableOpacity
                                                        onPress={handleSubmit}
                                                        disabled={!canSubmit}
                                                        testID="trackweight-submit"
                                                        activeOpacity={0.7}
                                                        style={{ opacity: canSubmit ? 1 : 0.4 }}
                                                >
                                                        <AntDesign
                                                                name="check-circle"
                                                                size={24}
                                                                color={Colors[colorScheme ?? "light"].tint}
                                                        />
                                                </TouchableOpacity>
                                        )}
                                </View>
                        ),
                });
        }, [navigation, colorScheme, canSubmit, handleSubmit, isSubmitting]);

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
                                        onChangeText={handleWeightChange}
                                        placeholder="170.0"
                                        unit="lbs"
                                        error={errors.weight}
                                        editable={!isSubmitting}
                                        inputMode="decimal"
                                        keyboardType="decimal-pad"
                                        maxLength={5}
                                        enterKeyHint="next"
                                />
                                {Platform.OS === "web" ? (
                                        <WebDatePicker
                                                label="Date"
                                                value={date}
                                                onChange={handleDateChange}
                                                error={errors.date}
                                                disabled={isSubmitting}
                                        />
                                ) : (
                                        <DatePickerWithPrefixSuffix
                                                label="Date"
                                                value={date}
                                                onChange={handleDateChange}
                                                error={errors.date}
                                                disabled={isSubmitting}
                                                showPicker={showDatePicker}
                                                setShowPicker={setShowDatePicker}
                                        />
                                )}
                        </Pressable>
                </SafeAreaView>
        );
}
