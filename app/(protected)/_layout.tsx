import { Redirect, Stack } from "expo-router";
import { getAuthSession } from "../../utils/storage";

export default function ProtectedLayout() {
  if (!getAuthSession()) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}