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
      <Stack.Screen
        name="recipes"
        options={{
          headerTitle: 'Recipes',
          headerBackButtonDisplayMode: 'generic',
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="logfood"
        options={{
          headerTitle: 'Log food',
          headerBackButtonDisplayMode: 'generic',
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="createfood"
        options={{
          headerTitle: 'Create food',
          headerBackButtonDisplayMode: 'generic',
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="scanbarcode"
        options={{
          headerTitle: 'Scan barcode',
          headerBackButtonDisplayMode: 'generic',
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
