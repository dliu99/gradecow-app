import { useEffect, useState } from "react";
import { Redirect, Stack, Slot, Tabs, usePathname } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getAuthSession, verifyAndRefreshAuth } from "../../utils/storage";
import { Icon, Label } from "expo-router/unstable-native-tabs";
import { NativeTabs } from "expo-router/unstable-native-tabs";
export default function ProtectedLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const session = getAuthSession();
      console.log('checking session');
      if (!session) {
        setIsLoading(false);
        return;
      }

      const isValid = await verifyAndRefreshAuth();
      console.log('isValid', isValid);
      setIsAuthenticated(isValid);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  return (
    <Stack>
      <Stack.Screen name="see-all" options={{ presentation: 'card', headerShown: false }}/>
      <Stack.Screen name="day-modal" options={{ presentation: 'card', headerShown: true }}/>
      <Stack.Screen name="assignment-modal" options={{ headerShown: true }}/>
      <Stack.Screen name="(tabs)" options={{ presentation: 'modal', headerShown: false }}/>
    </Stack>
  );
}
