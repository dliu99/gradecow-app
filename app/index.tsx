import { Redirect } from 'expo-router';
import { getAuthSession } from '@/utils/storage';

export default function Index() {
  const session = getAuthSession();

  if (session) {
    return <Redirect href="/(protected)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
