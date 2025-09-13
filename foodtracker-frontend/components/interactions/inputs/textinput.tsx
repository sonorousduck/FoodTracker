import React, { useEffect, useRef, useState } from "react";
import {
	Animated,
	BlurEvent,
	FocusEvent,
	KeyboardTypeOptions,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TextInputProps,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle,
} from "react-native";

interface DuckTextInputProps extends Omit<TextInputProps, "style"> {
	label?: string;
	placeholder?: string;
	value?: string;
	onChangeText?: (text: string) => void;
	onFocus?: (e: FocusEvent) => void;
	onBlur?: (e: BlurEvent) => void;
	error?: string;
	helperText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	onRightIconPress?: () => void;
	secureTextEntry?: boolean;
	keyboardType?: KeyboardTypeOptions;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	autoCorrect?: boolean;
	maxLength?: number;
	multiline?: boolean;
	numberOfLines?: number;
	editable?: boolean;
	required?: boolean;
	style?: ViewStyle;
	inputStyle?: TextStyle;
	containerStyle?: ViewStyle;
}

const DuckTextInput: React.FC<DuckTextInputProps> = ({
	label,
	placeholder,
	value,
	onChangeText,
	onFocus,
	onBlur,
	error,
	helperText,
	leftIcon,
	rightIcon,
	onRightIconPress,
	secureTextEntry = false,
	keyboardType = "default",
	autoCapitalize = "sentences",
	autoCorrect = true,
	maxLength,
	multiline = false,
	numberOfLines = 1,
	editable = true,
	required = false,
	style,
	inputStyle,
	containerStyle,
	...props
}) => {
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [isSecure, setIsSecure] = useState<boolean>(secureTextEntry);
	const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;
	const inputRef = useRef<TextInput>(null);

	useEffect(() => {
		Animated.timing(animatedIsFocused, {
			toValue: isFocused || value ? 1 : 0,
			duration: 200,
			useNativeDriver: false,
		}).start();
	}, [isFocused, value, animatedIsFocused]);

	const handleFocus = (e: FocusEvent): void => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: BlurEvent): void => {
		setIsFocused(false);
		onBlur?.(e);
	};

	const toggleSecureEntry = (): void => {
		setIsSecure(!isSecure);
	};

	const focusInput = (): void => {
		inputRef.current?.focus();
	};

	const labelStyle: Animated.AnimatedProps<TextStyle> = {
		position: "absolute",
		left: leftIcon ? 50 : 16,
		top: animatedIsFocused.interpolate({
			inputRange: [0, 1],
			outputRange: [multiline ? 20 : 18, 8],
		}),
		fontSize: animatedIsFocused.interpolate({
			inputRange: [0, 1],
			outputRange: [16, 12],
		}),
		color: animatedIsFocused.interpolate({
			inputRange: [0, 1],
			outputRange: ["#8E8E93", isFocused ? "#007AFF" : "#8E8E93"],
		}),
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 4,
		zIndex: 1,
	};

	const getBorderColor = (): string => {
		if (error) return "#FF3B30";
		if (isFocused) return "#007AFF";
		return "#D1D1D6";
	};

	const getBackgroundColor = (): string => {
		if (!editable) return "#F2F2F7";
		return "#FFFFFF";
	};

	return (
		<View style={[styles.container, containerStyle]}>
			<View
				style={[
					styles.inputContainer,
					{
						borderColor: getBorderColor(),
						backgroundColor: getBackgroundColor(),
						minHeight: multiline ? 80 : 56,
					},
					style,
				]}
			>
				{label && (
					<TouchableOpacity
						onPress={focusInput}
						activeOpacity={1}
						style={styles.labelContainer}
					>
						<Animated.Text style={labelStyle}>
							{label}
							{required && <Text style={styles.required}> *</Text>}
						</Animated.Text>
					</TouchableOpacity>
				)}

				<View style={styles.inputRow}>
					{leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

					<TextInput
						ref={inputRef}
						style={[
							styles.input,
							{
								paddingTop: label ? 24 : 16,
								paddingLeft: leftIcon ? 50 : 16,
								paddingRight: rightIcon || secureTextEntry ? 50 : 16,
								textAlignVertical: multiline ? "top" : "center",
								height: multiline ? Math.max(80, numberOfLines * 20 + 36) : 56,
							},
							inputStyle,
						]}
						value={value}
						onChangeText={onChangeText}
						onFocus={handleFocus}
						onBlur={handleBlur}
						placeholder={!label || isFocused || value ? placeholder : ""}
						placeholderTextColor="#C7C7CC"
						secureTextEntry={isSecure}
						keyboardType={keyboardType}
						autoCapitalize={autoCapitalize}
						autoCorrect={autoCorrect}
						maxLength={maxLength}
						multiline={multiline}
						numberOfLines={numberOfLines}
						editable={editable}
						{...props}
					/>

					{(rightIcon || secureTextEntry) && (
						<TouchableOpacity
							style={styles.rightIcon}
							onPress={secureTextEntry ? toggleSecureEntry : onRightIconPress}
							activeOpacity={0.7}
						>
							{secureTextEntry ? (
								<Text style={styles.eyeIcon}>{isSecure ? "👁️" : "🙈"}</Text>
							) : (
								rightIcon
							)}
						</TouchableOpacity>
					)}
				</View>
			</View>

			{(error || helperText || maxLength) && (
				<View style={styles.bottomContainer}>
					<View style={styles.messageContainer}>
						{error ? (
							<Text style={styles.errorText}>{error}</Text>
						) : helperText ? (
							<Text style={styles.helperText}>{helperText}</Text>
						) : null}
					</View>

					{maxLength && (
						<Text style={styles.characterCount}>
							{value?.length || 0}/{maxLength}
						</Text>
					)}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	inputContainer: {
		borderWidth: 1,
		borderRadius: 12,
		position: "relative",
		backgroundColor: "#FFFFFF",
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	labelContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: "#000000",
		paddingVertical: 16,
		paddingHorizontal: 16,
		minHeight: 56,
		...Platform.select({
			web: {
				outlineWidth: 0,
			},
		}),
	},
	leftIcon: {
		position: "absolute",
		left: 16,
		top: 18,
		zIndex: 2,
	},
	rightIcon: {
		position: "absolute",
		right: 16,
		top: 18,
		zIndex: 2,
		padding: 4,
	},
	eyeIcon: {
		fontSize: 18,
	},
	required: {
		color: "#FF3B30",
		fontSize: 12,
	},
	bottomContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 4,
		paddingHorizontal: 4,
	},
	messageContainer: {
		flex: 1,
	},
	errorText: {
		color: "#FF3B30",
		fontSize: 12,
		fontWeight: "500",
	},
	helperText: {
		color: "#8E8E93",
		fontSize: 12,
	},
	characterCount: {
		color: "#8E8E93",
		fontSize: 12,
		marginLeft: 8,
	},
});

export default DuckTextInput;
