import "react-native-reanimated";

import { SessionProvider, useSession } from "@/hooks/auth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";

import SplashScreenController from "./splash";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const { isLoading } = useSession();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <PaperProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            {isLoading ? <SplashScreenController /> : <RootNavigator />}
          </GestureHandlerRootView>
        </PaperProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();

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
