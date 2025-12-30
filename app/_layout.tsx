import '../global.css';

import { Stack } from 'expo-router';

import '@/global.css';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="(auth)/school-select"
        options={{ headerShown: true, headerTransparent: true, headerTitle: '' }}
      />
      <Stack.Screen name="(auth)/auth-modal" options={{ presentation: 'modal', headerShown: true }} />
      <Stack.Screen name="(protected)" options={{ headerShown: false }} />
    </Stack>
  );
}
