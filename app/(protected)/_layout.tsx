import { useEffect, useState } from "react";
import { Redirect, Stack, Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getAuthSession, verifyAndRefreshAuth } from "../../utils/storage";
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function ProtectedLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      <View className="flex-1 items-center justify-center bg-teal-950">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Label hidden>Dashboard</Label>
        <Icon sf="calendar.circle" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grades">
        <Label hidden>Grades</Label>
        <Icon sf="chart.bar" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label hidden>Profile</Label>
        <Icon sf="person.crop.circle" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
