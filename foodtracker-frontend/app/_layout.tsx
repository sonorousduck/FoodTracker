import "react-native-reanimated";

import { SessionProvider, useSession } from "@/hooks/auth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";

import SplashScreenController from "./splash";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const paperTheme =
    colorScheme === "dark"
      ? {
          ...MD3DarkTheme,
          colors: {
            ...MD3DarkTheme.colors,
            primary: colors.tint,
            secondary: colors.tabIconSelected,
            background: colors.background,
            onBackground: colors.text,
            surface: colors.modal,
            surfaceVariant: colors.modalSecondary,
            onSurface: colors.text,
            onSurfaceVariant: colors.text,
            inverseSurface: colors.modal,
            inverseOnSurface: colors.text,
          },
        }
      : {
          ...MD3LightTheme,
          colors: {
            ...MD3LightTheme.colors,
            primary: colors.tint,
            secondary: colors.tabIconSelected,
            background: colors.background,
            onBackground: colors.text,
            surface: colors.modal,
            surfaceVariant: colors.modalSecondary,
            onSurface: colors.text,
            onSurfaceVariant: colors.text,
            inverseSurface: colors.modal,
            inverseOnSurface: colors.text,
          },
        };
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <PaperProvider theme={paperTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootNavigator />
          </GestureHandlerRootView>
        </PaperProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <SplashScreenController />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={session != null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="signin" />
        <Stack.Screen name="createaccount" />
      </Stack.Protected>
    </Stack>
  );
}
