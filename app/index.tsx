import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getAuthSession, verifyAndRefreshAuth } from '@/utils/storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const session = getAuthSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const isValid = await verifyAndRefreshAuth();
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

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
