import { Stack } from 'expo-router'

export default function CourseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="all-grades" options={{ presentation: 'card' }} />
    </Stack>
  )
}

