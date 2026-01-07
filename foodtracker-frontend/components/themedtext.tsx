import { useThemeColor } from "@/hooks/useThemeColor";
import { Text, type TextProps } from "react-native";

type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
};

export default function ThemedText({
	style,
	lightColor,
	darkColor,
	...rest
}: ThemedTextProps) {
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
	return <Text style={[{ color }, style]} {...rest} />;
}
