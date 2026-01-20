import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { WhatIfProvider } from './_context'
import { EditGradeSheet } from '@/components/EditGradeSheet'

export default function CourseLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WhatIfProvider>
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
        <EditGradeSheet />
      </WhatIfProvider>
    </GestureHandlerRootView>
  )
}
