import { View, Text, ActivityIndicator, Pressable, Alert, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser, useProfile, useAppList } from '@/hooks/use-ic'
import { App, AppTool } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query'
import { clearAuth } from '@/utils/storage'
import { useState } from 'react'

function ProfileCard({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="rounded-2xl p-5 border border-stone-700 flex-1">
      <Text className="text-white text-4xl font-bold">{value ?? '—'}</Text>
      <Text className="text-stone-500 text-base mt-2">{label}</Text>
    </View>
  )
}

export default function Profile() {
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useUser()
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile()
  const { refetch: refetchAppList, isFetching: appListFetching } = useAppList(false)
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchUser(), refetchProfile()])
    } finally {
      setRefreshing(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            clearAuth()
            queryClient.clear()
            router.replace('/(auth)/onboarding')
          },
        },
      ]
    )
  }

  const isLoading = userLoading || profileLoading

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
      <ScrollView
        className="flex-1 px-4 pt-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            title="Refreshing..."
            titleColor="white"
            progressBackgroundColor="white"
          />
        }
      >
        <Text className="text-white text-4xl font-bold mb-6">Profile</Text>

        {profile?.gpa && (
          <View className="flex-row gap-4 mb-4">
            <ProfileCard label="Unweighted GPA" value={profile.gpa.uw} />
            <ProfileCard label="Weighted GPA" value={profile.gpa.w} />
          </View>
        )}
        {profile?.absences !== null && profile?.tardies !== null && (
          <View className="flex-row gap-4 mb-4">
            <ProfileCard label="Absences" value={profile?.absences?.toString() ?? '—'} />
            <ProfileCard label="Tardies" value={profile?.tardies?.toString() ?? '—'} />
          </View>
        )}
        <Pressable
          onPress={() => router.push('/(protected)/(tabs)/profile/about')}
          className="rounded-2xl p-5 border border-stone-700 mb-4 active:scale-[0.97] active:opacity-80"
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-semibold">About gradecow 🐂</Text>
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </View>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const result = await refetchAppList()
              const appListArray: App[] | undefined = result.data
              const hasResponsiveSchedule = appListArray?.some((app: App) =>
                app.tools?.some((tool: AppTool) => tool.code === 'student.responsive-schedule' && tool.display)
              )
              if (hasResponsiveSchedule) {
                router.push('/(protected)/(tabs)/profile/responsive-schedule')
              } else {
                Alert.alert('Not available', 'Responsive scheduling is not available for your account.')
              }
            } catch (error) {
              Alert.alert('Error', 'Unable to check responsive scheduling right now.')
            }
          }}
          className="rounded-2xl p-5 border border-stone-700 mb-4 active:scale-[0.97] active:opacity-80"
          disabled={appListFetching}
          style={{ opacity: appListFetching ? 0.6 : 1 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-semibold">Responsive Schedule</Text>
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </View>
        </Pressable>

        

        <Pressable
          onPress={handleSignOut}
          className="rounded-2xl p-5 bg-red-900/50 mb-32 active:scale-[0.97] active:opacity-80"
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-xl font-semibold">Sign Out</Text>
            <Ionicons name="log-out-outline" size={24} color="#fca5a5" />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
