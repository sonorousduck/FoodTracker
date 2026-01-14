import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="trackweight"
        options={{
          headerTitle: 'Add weight',
          headerBackButtonDisplayMode: 'generic',
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="recipe"
        options={{
          headerTitle: 'Create recipe',
          headerBackButtonDisplayMode: 'generic',
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
