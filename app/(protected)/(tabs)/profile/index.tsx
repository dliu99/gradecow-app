import { View, Text, ActivityIndicator, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser, useProfile, useAppList } from '@/hooks/use-ic'
import { App, AppTool } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query'
import { clearAuth } from '@/utils/storage'
function ProfileCard({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="bg-stone-800 rounded-2xl p-5 flex-1">
      <Text className="text-white text-4xl font-bold">{value ?? '—'}</Text>
      <Text className="text-stone-400 text-base mt-2">{label}</Text>
    </View>
  )
}

export default function Profile() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { refetch: refetchAppList, isFetching: appListFetching } = useAppList(false)
  const queryClient = useQueryClient()

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
      <View className="flex-1 px-5 pt-9">
        <Text className="text-white text-3xl font-bold mb-4">
          {/*{user?.firstName} {user?.lastName}*/}
          Profile
        </Text>

        {profile?.gpa && (
          <View className="flex-row gap-4 mb-4">
            <ProfileCard label="Unweighted GPA" value={profile.gpa.uw} />
            <ProfileCard label="Weighted GPA" value={profile.gpa.w} />
            
          </View>
        )}
        {profile?.absences !== null && profile?.tardies !== null && (
          <View className="flex-row gap-4">
            <ProfileCard label="Absences" value={profile?.absences?.toString() ?? '—'} />
            <ProfileCard label="Tardies" value={profile?.tardies?.toString() ?? '—'} />
          </View>
        )}

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
          className="bg-stone-800 rounded-2xl p-5 mt-4"
          disabled={appListFetching}
          style={{ opacity: appListFetching ? 0.6 : 1 }}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <Text className="text-white text-xl font-semibold leading-snug" numberOfLines={2}>Responsive Schedule</Text>
            </View>
            <View className="items-center justify-center">
              <Ionicons name="arrow-forward" size={24} color="#ffffff" />
            </View>
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/(protected)/(tabs)/profile/about')} className="bg-stone-800 rounded-2xl p-5 mt-4 mb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <Text className="text-white text-xl font-semibold leading-snug" numberOfLines={2}>About gradecow 🐂</Text>
            </View>
            <View className="items-center justify-center">
              <Ionicons name="arrow-forward" size={24} color="#ffffff" />
            </View>
          </View>
        </Pressable>
        <Pressable onPress={handleSignOut} className="bg-red-900/50 rounded-2xl p-5 mb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <Text className="text-white text-xl font-semibold leading-snug" numberOfLines={2}>Sign Out</Text>
            </View>
            <View className="items-center justify-center">
              <Ionicons name="log-out-outline" size={24} color="#fca5a5" />
            </View>
          </View>
        </Pressable>


      </View>

    </SafeAreaView>
  )
}
