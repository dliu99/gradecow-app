import '../global.css';

import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';

import '@/global.css';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache, focusManager } from '@tanstack/react-query'
import { verifyAndRefreshAuth } from '@/utils/storage'

let isRefreshing = false

async function handle401Error(queryClient: QueryClient) {
  if (isRefreshing) return
  isRefreshing = true
  try {
    const refreshed = await verifyAndRefreshAuth()
    if (refreshed) {
      queryClient.invalidateQueries()
    }
  } finally {
    isRefreshing = false
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: (failureCount, error: any) => {
        if (error?.status === 401) {
          return false
        }
        return failureCount < 3
      },
    },
  },
  queryCache: new QueryCache({
    onError: async (error: any) => {
      if (error?.status === 401) {
        await handle401Error(queryClient)
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: async (error: any) => {
      if (error?.status === 401) {
        await handle401Error(queryClient)
      }
    },
  }),
})

export default function Layout() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active')
      }
    })
    return () => subscription.remove()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
