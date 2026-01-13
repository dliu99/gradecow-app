import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          headerTransparent: true,
          title: '🐂',
          headerShown: true,
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  )
}